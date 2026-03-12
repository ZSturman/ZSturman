// README generation orchestrator.
// Fetches data from Notion, runs all variant generators, writes output files,
// and logs execution to the Notion automation logs database.
//
// Required env vars:
//   NOTION_TOKEN           — Notion integration token
//   NOTION_PROJECTS_DB_ID  — Projects database ID
//
// Optional env vars (gracefully skipped if missing):
//   NOTION_WORK_LOG_DB_ID         — Work Log database ID
//   NOTION_PERSONAL_LINKS_DB_ID   — Personal Links database ID
//   NOTION_MILESTONES_DB_ID       — Milestones database ID
//   NOTION_TASKS_DB_ID            — Tasks database ID
//   NOTION_RESOURCES_DB_ID        — Resources database ID
//   NOTION_AUTOMATION_LOGS_DB_ID  — Automation Logs database ID
//   PRIMARY_VARIANT                — Which variant to copy to README.md
//                                    (default: "editorial-clean")

const fs = require("fs");
const path = require("path");

const {
  fetchFeaturedProjects,
  fetchRecentWorkLogs,
  fetchPersonalLinks,
  fetchActiveMilestones,
  fetchRecentCompletedTasks,
  fetchResources,
  computeStats,
} = require("./lib/notion");

const { logStart, logSuccess, logFailure } = require("./lib/automation-log");

// ── Variant registry ─────────────────────────────────────────────────────────

const VARIANTS = {
  "minimalist-retro": require("./variants/minimalist-retro"),
  "editorial-clean": require("./variants/editorial-clean"),
  "technical-showcase": require("./variants/technical-showcase"),
  "quiet-premium": require("./variants/quiet-premium"),
  "systems-focused": require("./variants/systems-focused"),
};

const DEFAULT_PRIMARY = "editorial-clean";

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate minimum config
  if (!process.env.NOTION_TOKEN) {
    throw new Error("Missing NOTION_TOKEN");
  }
  if (!process.env.NOTION_PROJECTS_DB_ID) {
    throw new Error("Missing NOTION_PROJECTS_DB_ID");
  }

  const primaryVariant = process.env.PRIMARY_VARIANT || DEFAULT_PRIMARY;
  if (!VARIANTS[primaryVariant]) {
    throw new Error(
      `Unknown PRIMARY_VARIANT "${primaryVariant}". Available: ${Object.keys(VARIANTS).join(", ")}`
    );
  }

  // Determine trigger source for logging
  const trigger =
    process.env.GITHUB_EVENT_NAME || // "schedule", "workflow_dispatch", etc.
    "manual";
  const executionId =
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || "1"}`
      : `local-${Date.now()}`;

  // ── Start automation log ────────────────────────────────────────────────
  const logPageId = await logStart({ trigger, executionId });

  try {
    // ── Fetch all data in parallel ──────────────────────────────────────
    console.log("Fetching data from Notion...");

    const [
      projectsResult,
      workLogsResult,
      linksResult,
      milestonesResult,
      tasksResult,
      resourcesResult,
    ] = await Promise.allSettled([
      fetchFeaturedProjects(),
      fetchRecentWorkLogs(10),
      fetchPersonalLinks(),
      fetchActiveMilestones(),
      fetchRecentCompletedTasks(15),
      fetchResources(),
    ]);

    const projects = unwrap(projectsResult, "projects");
    const workLogs = unwrap(workLogsResult, "workLogs");
    const links = unwrap(linksResult, "personalLinks");
    const milestones = unwrap(milestonesResult, "milestones");
    const tasks = unwrap(tasksResult, "tasks");
    const resources = unwrap(resourcesResult, "resources");

    // Attach resources to their parent projects
    const resourcesByProject = new Map();
    for (const r of resources) {
      for (const pid of r.projectIds) {
        if (!resourcesByProject.has(pid)) resourcesByProject.set(pid, []);
        resourcesByProject.get(pid).push(r);
      }
    }
    for (const p of projects) {
      p.resources = resourcesByProject.get(p.id) || [];
    }

    const stats = computeStats({ projects, workLogs, milestones, tasks });

    console.log(
      `Fetched: ${projects.length} projects, ${workLogs.length} work logs, ` +
        `${links.length} links, ${milestones.length} milestones, ` +
        `${tasks.length} tasks, ${resources.length} resources`
    );

    const data = { projects, workLogs, links, milestones, tasks, resources, stats };

    // ── Generate all variants ───────────────────────────────────────────
    console.log("Generating variants...");

    const generated = {};
    for (const [name, variant] of Object.entries(VARIANTS)) {
      try {
        generated[name] = variant.generate(data);
        console.log(`  ✓ ${name}`);
      } catch (err) {
        console.error(`  ✗ ${name}: ${err.message}`);
        generated[name] = null;
      }
    }

    // ── Write output files ──────────────────────────────────────────────
    console.log("Writing output files...");

    let filesWritten = 0;
    for (const [name, content] of Object.entries(generated)) {
      if (!content) continue;
      const filename = `README.${name}.md`;
      fs.writeFileSync(filename, content);
      console.log(`  → ${filename}`);
      filesWritten++;
    }

    // Copy primary variant to README.md
    const primaryContent = generated[primaryVariant];
    if (primaryContent) {
      fs.writeFileSync("README.md", primaryContent);
      console.log(`  → README.md (from ${primaryVariant})`);
      filesWritten++;
    } else {
      console.warn(
        `Primary variant "${primaryVariant}" failed — README.md not updated.`
      );
    }

    console.log(`Done. ${filesWritten} files written.`);

    // ── Log success ─────────────────────────────────────────────────────
    const variantNames = Object.entries(generated)
      .filter(([, v]) => v !== null)
      .map(([n]) => n);

    await logSuccess(logPageId, {
      details: `Generated ${variantNames.length} variants: ${variantNames.join(", ")}. Primary: ${primaryVariant}.`,
      projectsCount: projects.length,
      workLogsCount: workLogs.length,
    });
  } catch (err) {
    console.error("README generation failed:");
    console.error(err.message);

    await logFailure(logPageId, {
      error: err.message,
      failedNode: "generate-readme.js",
    });

    process.exit(1);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function unwrap(result, label) {
  if (result.status === "fulfilled") {
    return result.value;
  }
  console.warn(`Failed to fetch ${label}: ${result.reason?.message || result.reason}`);
  return [];
}

main();
