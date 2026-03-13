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

const fs = require("fs");
const path = require("path");
// Load environment variables from a local .env file when running manually.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });


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

const refined = require("./variants/refined");

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate minimum config
  if (!process.env.NOTION_TOKEN) {
    throw new Error("Missing NOTION_TOKEN");
  }
  if (!process.env.NOTION_PROJECTS_DB_ID) {
    throw new Error("Missing NOTION_PROJECTS_DB_ID");
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

    // Attach resources to their parent projects.
    // Use two strategies: (1) resource's projectIds (reverse relation),
    // (2) project's own repoIds + resourceIds (forward relations).
    const resourceById = new Map();
    const resourcesByProject = new Map();
    for (const r of resources) {
      resourceById.set(r.id, r);
      for (const pid of r.projectIds) {
        if (!resourcesByProject.has(pid)) resourcesByProject.set(pid, []);
        resourcesByProject.get(pid).push(r);
      }
    }
    for (const p of projects) {
      const fromReverse = resourcesByProject.get(p.id) || [];
      const directIds = new Set([...(p.repoIds || []), ...(p.resourceIds || [])]);
      const fromDirect = [...directIds]
        .map((id) => resourceById.get(id))
        .filter(Boolean);
      // Merge and deduplicate by resource ID
      const seen = new Set();
      p.resources = [];
      for (const r of [...fromDirect, ...fromReverse]) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          p.resources.push(r);
        }
      }
    }

    const stats = computeStats({ projects, workLogs, milestones, tasks });

    console.log(
      `Fetched: ${projects.length} projects, ${workLogs.length} work logs, ` +
        `${links.length} links, ${milestones.length} milestones, ` +
        `${tasks.length} tasks, ${resources.length} resources`
    );

    const data = { projects, workLogs, links, milestones, tasks, resources, stats };

    // ── Generate README ─────────────────────────────────────────────────
    console.log("Generating README...");

    const content = refined.generate(data);

    // ── Write output file ───────────────────────────────────────────────
    fs.writeFileSync("README.md", content);
    console.log("  → README.md");
    console.log("Done.");

    // ── Log success ─────────────────────────────────────────────────────
    await logSuccess(logPageId, {
      details: `Generated README.md from refined variant.`,
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
