// Systems Focused — "Connected Studio"
// Shows interconnection between projects, milestones, and ongoing work.
// Studio/agency portfolio feel with rich contextual layering.
// Signature: Mermaid ecosystem diagram, <kbd> skills, week-grouped activity,
// resource link badges, collapsible project details with relationship diagrams.

const {
  joinLines,
  heading,
  bold,
  italic,
  inlineCode,
  link,
  blockquote,
  progressBar,
  details,
  alignCenter,
  divider,
  formatDate,
  formatDateShort,
  relativeTime,
  truncate,
  image,
  kbdTag,
  mermaid,
  linkedBadge,
  resourceBadges,
  sectionDivider,
} = require("../lib/renderer");
const { isStableImageUrl } = require("../lib/github-compat");
const { deriveSkills } = require("../lib/skills");

function generate(data) {
  const { projects, workLogs, milestones, tasks, links, stats } = data;

  const sections = [
    renderHero(projects),
    renderEcosystem(projects),
    renderStack(projects),
    renderCurrentFocus(milestones),
    renderProjectShowcase(projects),
    renderStudioActivity(workLogs, stats),
    renderNextUp(tasks),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function renderHero(projects) {
  // Build a dynamic positioning line from project domains
  const verbs = ["building", "designing", "shipping"];
  const highlights = projects
    .slice(0, 3)
    .map((p, i) => `${verbs[i] || "exploring"} ${bold(p.title)}`);

  const positioningLine =
    highlights.length > 0
      ? highlights.join(" → ")
      : "building tools for how people think and work";

  return joinLines(
    "# Zachary Sturman",
    "",
    `> ${positioningLine}`,
    "",
    italic("Product engineer · Designer · Maker of systems that work with you, not against you.")
  );
}

// ── Ecosystem Diagram ────────────────────────────────────────────────────────

function renderEcosystem(projects) {
  if (projects.length < 2) return null;

  // Build a graph showing projects grouped by category/status with connections
  const lines = ["graph LR"];

  // Style definitions
  lines.push("  classDef active fill:#2da44e,stroke:#2da44e,color:#fff");
  lines.push("  classDef complete fill:#8250df,stroke:#8250df,color:#fff");
  lines.push("  classDef default fill:#f6f8fa,stroke:#d1d9e0,color:#1f2328");

  // Create nodes for each project
  for (const p of projects) {
    const id = safeId(p.title);
    const label = p.title;
    lines.push(`  ${id}["${label}"]`);

    // Apply status-based styling
    const statusLower = (p.status || "").toLowerCase();
    if (statusLower.includes("active")) {
      lines.push(`  class ${id} active`);
    } else if (statusLower.includes("complete")) {
      lines.push(`  class ${id} complete`);
    }
  }

  // Connect projects that share tags (lightweight relationship indicator)
  const projectPairs = [];
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const shared = projects[i].tags.filter((t) => projects[j].tags.includes(t));
      if (shared.length > 0) {
        const a = safeId(projects[i].title);
        const b = safeId(projects[j].title);
        projectPairs.push(`  ${a} -.-|"${shared[0]}"| ${b}`);
      }
    }
  }
  lines.push(...projectPairs.slice(0, 6)); // Limit connections to avoid clutter

  return joinLines(
    heading(2, "Project Ecosystem"),
    "",
    mermaid(lines.join("\n"))
  );
}

function safeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
}

// ── Stack / Skills ───────────────────────────────────────────────────────────

function renderStack(projects) {
  const skills = deriveSkills(projects);
  if (!skills.all.length) return null;

  const parts = [];
  for (const [category, items] of skills.byCategory) {
    const tags = items.map((s) => kbdTag(s.label)).join(" ");
    parts.push(`**${category}** ${tags}`);
  }

  return joinLines(
    heading(3, "Stack"),
    "",
    ...parts,
    ""
  );
}

// ── Current Focus ────────────────────────────────────────────────────────────

function renderCurrentFocus(milestones) {
  if (!milestones.length) return null;

  const items = milestones.slice(0, 4).map((m) => {
    const pct = m.taskPercentComplete ?? 0;
    const bar = progressBar(pct, 16);
    const project = m.projectName ? italic(m.projectName) : "";
    const blocked = m.isBlocked ? " · ⚠ blocked" : "";
    const desc = m.description ? `\n  ${truncate(m.description, 120)}` : "";

    return joinLines(
      `**${m.milestone}** ${project}${blocked}`,
      `\`${bar}\`${desc}`,
      ""
    );
  });

  return joinLines(heading(2, "Current Focus"), "", ...items);
}

// ── Project Showcase ─────────────────────────────────────────────────────────

function renderProjectShowcase(projects) {
  if (!projects.length) return null;

  const categorized = groupByCategory(projects);
  const sections = [];

  for (const [category, categoryProjects] of categorized) {
    if (categorized.size > 1 && category) {
      sections.push(`### ${category}`);
      sections.push("");
    }

    for (const p of categoryProjects) {
      sections.push(renderProjectEntry(p));
    }
  }

  return joinLines(heading(2, "Projects"), "", ...sections);
}

function groupByCategory(projects) {
  const groups = new Map();
  for (const p of projects) {
    const cat = p.category?.[0] || "";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(p);
  }
  return groups;
}

function renderProjectEntry(p) {
  const title = p.repoLink ? link(bold(p.title), p.repoLink) : bold(p.title);
  const subtitle = p.subtitle ? ` — ${italic(p.subtitle)}` : "";
  const status = [p.status, p.phase].filter(Boolean).join(" · ");
  const statusLine = status ? `\n${inlineCode(status)}` : "";
  const tags =
    p.tags.length > 0
      ? " " + p.tags.map((t) => inlineCode(t)).join(" ")
      : "";

  // Resource link badges (repo, download, visit, etc.)
  const resBadges = resourceBadges(p.resources || [], "flat-square");
  const downloadBadge =
    !resBadges.includes("download") && p.downloadUrl
      ? linkedBadge("Download", p.downloadUrl, { logo: "download", color: "0969da" })
      : "";
  const badgeLine = [resBadges, downloadBadge].filter(Boolean).join(" ");

  // Collapsible detail with summary, images, and fuller description
  const expandedParts = [];
  if (p.summary) expandedParts.push(p.summary);

  const imageUrl = pickBestImage(p);
  if (imageUrl) {
    expandedParts.push(`<img src="${imageUrl}" alt="${p.title}" width="600" />`);
  }

  if (p.mediums.length > 0) {
    expandedParts.push(`**Mediums:** ${p.mediums.join(", ")}`);
  }
  if (p.startedAt) {
    expandedParts.push(`**Started:** ${formatDate(p.startedAt)}`);
  }
  if (p.lastUpdateAt) {
    expandedParts.push(`**Last update:** ${relativeTime(p.lastUpdateAt)}`);
  }

  const expandable =
    expandedParts.length > 0
      ? "\n" + details("More details", joinLines(...expandedParts))
      : "";

  return joinLines(
    `${title}${subtitle}${statusLine}${tags}`,
    p.oneLiner ? `${p.oneLiner}` : "",
    badgeLine,
    expandable,
    ""
  );
}

function pickBestImage(project) {
  const candidates = [
    project.bannerPreview,
    project.heroPreview,
    project.thumbnailPreview,
  ];
  return candidates.find((url) => isStableImageUrl(url)) || null;
}

// ── Studio Activity ──────────────────────────────────────────────────────────

function renderStudioActivity(workLogs, stats) {
  if (!workLogs.length) return null;

  // Group recent logs by week
  const recentLogs = workLogs.slice(0, 10);
  const weeks = groupByWeek(recentLogs);

  const timelineEntries = [];
  for (const [weekLabel, logs] of weeks) {
    timelineEntries.push(`#### ${weekLabel}`);
    for (const log of logs) {
      const date = formatDateShort(log.date) || "—";
      const project = log.projectName ? bold(log.projectName) : "";
      const entry = truncate(log.entry || log.whatHappened, 80);
      const duration = log.duration ? `${log.duration}m` : "";
      const type = log.sessionType ? inlineCode(log.sessionType) : "";

      timelineEntries.push(
        `◆ **${date}** ${project} ${type}\n  ${entry} ${duration ? italic(`(${duration})`) : ""}`
      );
    }
    timelineEntries.push("");
  }

  // Show next step from most recent log
  const nextStep = recentLogs[0]?.nextStep;
  const nextStepLine = nextStep
    ? joinLines("", `> **Next →** ${truncate(nextStep, 120)}`, "")
    : "";

  const statsLine =
    stats.sessionsLast30Days > 0
      ? joinLines(
          "",
          blockquote(
            `${stats.sessionsLast30Days} sessions · ${stats.hoursLast30Days} hours over the last 30 days`
          )
        )
      : "";

  return joinLines(
    heading(2, "Studio Activity"),
    "",
    ...timelineEntries,
    nextStepLine,
    statsLine
  );
}

function groupByWeek(logs) {
  const weeks = new Map();
  for (const log of logs) {
    if (!log.date) continue;
    const d = new Date(log.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay()); // Sunday
    const label = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    if (!weeks.has(label)) weeks.set(label, []);
    weeks.get(label).push(log);
  }
  return weeks;
}

// ── Recently Completed ───────────────────────────────────────────────────────

function renderNextUp(tasks) {
  if (!tasks.length) return null;

  const items = tasks.slice(0, 8).map((t) => {
    const project = t.projectName ? ` (${t.projectName})` : "";
    const date = t.dateCompleted ? ` — ${formatDateShort(t.dateCompleted)}` : "";
    const type = t.type ? ` ${kbdTag(t.type)}` : "";
    return `- ~~${t.task}~~${project}${type}${date}`;
  });

  return details(
    `${bold("Recently Completed")} — ${tasks.length} tasks`,
    joinLines(...items)
  );
}

// ── Links ────────────────────────────────────────────────────────────────────

function renderLinks(links) {
  if (!links.length) return null;

  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      const url = l.email ? `mailto:${l.email}` : l.url;
      return link(l.label, url);
    });

  if (!items.length) return null;

  return joinLines(
    divider(),
    "",
    heading(3, "Connect"),
    "",
    items.join(" · ")
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function renderFooter() {
  return joinLines(
    "",
    `<sub>This profile is generated from an interconnected Notion workspace — projects, milestones, work logs, and tasks feed into a single pipeline that renders this page.</sub>`
  );
}

module.exports = { generate };
