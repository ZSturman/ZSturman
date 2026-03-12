// Technical Showcase — "Engineering Dashboard"
// Data-rich, structured, tables, badges, metrics-forward.
// Feels like a project management status dashboard.
// Signature: GitHub stats cards, repo pin cards, Mermaid Gantt milestones,
// full shields.io badge skill grid, for-the-badge link bar.

const {
  joinLines,
  heading,
  bold,
  italic,
  inlineCode,
  link,
  badge,
  badgeUrl,
  progressBar,
  table,
  alignCenter,
  divider,
  formatDate,
  formatDateShort,
  truncate,
  details,
  linkedBadge,
  resourceBadges,
  githubStatsCard,
  streakCard,
  topLangsCard,
  repoCard,
  parseGitHubRepo,
  columns,
  mermaid,
  sectionDivider,
} = require("../lib/renderer");
const { deriveSkills, renderSkillBadges } = require("../lib/skills");

function generate(data) {
  const { projects, workLogs, milestones, tasks, links, stats } = data;

  const sections = [
    renderHero(stats),
    renderGitHubStats(),
    renderSkills(projects),
    renderProjects(projects),
    renderExecutionLog(workLogs),
    renderMilestones(milestones),
    renderRecentTasks(tasks),
    renderMetrics(stats),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function renderHero(stats) {
  const badges = [];
  if (stats.totalProjects > 0) {
    badges.push(badge("projects", String(stats.totalProjects), "0969da"));
  }
  if (stats.activeMilestones > 0) {
    badges.push(badge("milestones", String(stats.activeMilestones), "2da44e"));
  }
  if (stats.sessionsLast30Days > 0) {
    badges.push(badge("sessions·30d", String(stats.sessionsLast30Days), "8250df"));
  }
  if (stats.hoursLast30Days > 0) {
    badges.push(badge("hours·30d", String(stats.hoursLast30Days), "cf222e"));
  }

  return joinLines(
    alignCenter(
      joinLines(
        "# Zachary Sturman",
        "",
        "**Product Engineer · Designer · Systems Thinker**",
        "",
        badges.join("&ensp;")
      )
    ),
    "",
    sectionDivider("gradient")
  );
}

// ── GitHub Stats ─────────────────────────────────────────────────────────────

function renderGitHubStats() {
  const stats = githubStatsCard({ theme: "transparent", hideBorder: true });
  const streak = streakCard({ theme: "transparent", hideBorder: true });
  const langs = topLangsCard({ theme: "transparent", hideBorder: true, layout: "compact" });

  return joinLines(
    alignCenter(
      joinLines(
        "",
        stats,
        "",
        streak,
        "",
        langs,
        ""
      )
    )
  );
}

// ── Skills ───────────────────────────────────────────────────────────────────

function renderSkills(projects) {
  const skills = deriveSkills(projects);
  if (!skills.all.length) return null;

  const sections = [];
  for (const [category, items] of skills.byCategory) {
    const badges = renderSkillBadges(items, "for-the-badge");
    sections.push(`**${category}**\n\n${badges}`);
  }

  return joinLines(
    heading(2, "Tech Stack"),
    "",
    ...sections,
    ""
  );
}

// ── Projects ─────────────────────────────────────────────────────────────────

function renderProjects(projects) {
  if (!projects.length) return null;

  // Separate projects with GitHub repos (for pin cards) from others
  const withRepo = [];
  const withoutRepo = [];

  for (const p of projects) {
    const parsed = parseGitHubRepo(p.repoLink);
    // Also check resources for GitHub repos
    const resourceRepo = (p.resources || []).find(
      (r) => r.icon === "github" && r.url
    );
    const repoInfo = parsed || (resourceRepo ? parseGitHubRepo(resourceRepo.url) : null);

    if (repoInfo) {
      withRepo.push({ project: p, repoInfo });
    } else {
      withoutRepo.push(p);
    }
  }

  const parts = [];

  // Render repo pin cards in a 2-column layout
  if (withRepo.length) {
    const cards = withRepo.map(({ repoInfo }) =>
      repoCard(repoInfo.repo, { theme: "transparent", hideBorder: true })
    );
    parts.push(alignCenter(columns(cards, 2)));
  }

  // Render remaining projects as enhanced table
  if (withoutRepo.length) {
    const headers = ["Project", "Description", "Status", "Links"];
    const rows = withoutRepo.map((p) => {
      const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
      const desc = truncate(p.oneLiner, 60);
      const status = [p.status, p.phase].filter(Boolean).join(" · ") || "—";
      const resBadges = resourceBadges(p.resources || [], "flat-square");
      const dlBadge = p.downloadUrl
        ? linkedBadge("DL", p.downloadUrl, { logo: "download", color: "0969da", style: "flat-square" })
        : "";
      const linkCol = [resBadges, dlBadge].filter(Boolean).join(" ") || "—";
      return [name, desc, status, linkCol];
    });

    parts.push(table(headers, rows));
  }

  // Also show a full project table for comprehensive view
  if (withRepo.length) {
    const allHeaders = ["Project", "Description", "Status", "Tags", "Links"];
    const allRows = projects.map((p) => {
      const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
      const desc = truncate(p.oneLiner, 50);
      const status = [p.status, p.phase].filter(Boolean).join(" · ") || "—";
      const tags = p.tags.slice(0, 3).map((t) => inlineCode(t)).join(" ") || "—";
      const resBadges = resourceBadges(p.resources || [], "flat-square");
      const dlBadge = p.downloadUrl
        ? linkedBadge("DL", p.downloadUrl, { logo: "download", color: "0969da", style: "flat-square" })
        : "";
      const linkCol = [resBadges, dlBadge].filter(Boolean).join(" ") || "—";
      return [name, desc, status, tags, linkCol];
    });

    parts.push(details(bold("Full Project Table"), table(allHeaders, allRows)));
  }

  return joinLines(heading(2, "Projects"), "", ...parts);
}

// ── Execution Log ────────────────────────────────────────────────────────────

function renderExecutionLog(workLogs) {
  if (!workLogs.length) return null;

  const headers = ["Date", "Project", "Type", "Duration", "Entry"];
  const rows = workLogs.slice(0, 10).map((log) => {
    const date = formatDateShort(log.date) || "—";
    const project = log.projectName || "—";
    const type = log.sessionType
      ? `\`${log.sessionType}\``
      : "—";
    const duration = log.duration
      ? `**${log.duration}m**`
      : "—";
    const entry = truncate(log.entry, 45);
    return [date, project, type, duration, entry];
  });

  return joinLines(heading(2, "Execution Log"), "", table(headers, rows));
}

// ── Milestones ───────────────────────────────────────────────────────────────

function renderMilestones(milestones) {
  if (!milestones.length) return null;

  // Mermaid Gantt chart for timeline visualization
  const ganttLines = ["gantt", "  dateFormat YYYY-MM-DD", "  axisFormat %b %d"];
  let hasGanttData = false;

  for (const m of milestones) {
    const start = m.effectiveDoDate;
    const end = m.effectiveDueDate;
    if (start) {
      hasGanttData = true;
      const label = m.milestone.replace(/"/g, "'");
      const statusTag = m.isBlocked ? "crit," : "";
      if (end) {
        ganttLines.push(`  ${label} :${statusTag} ${start}, ${end}`);
      } else {
        ganttLines.push(`  ${label} :${statusTag} ${start}, 14d`);
      }
    }
  }

  const ganttChart = hasGanttData
    ? joinLines(mermaid(ganttLines.join("\n")), "")
    : "";

  // Table view
  const headers = ["Milestone", "Project", "Progress", "Status"];
  const rows = milestones.map((m) => {
    const pct = m.taskPercentComplete ?? 0;
    const bar = `\`${progressBar(pct, 12)}\``;
    const project = m.projectName || "—";
    const status = m.isBlocked ? "🔴 Blocked" : m.status || "—";
    return [m.milestone, project, bar, status];
  });

  return joinLines(
    heading(2, "Active Milestones"),
    "",
    ganttChart,
    table(headers, rows)
  );
}

// ── Recent Tasks ─────────────────────────────────────────────────────────────

function renderRecentTasks(tasks) {
  if (!tasks.length) return null;

  const items = tasks.slice(0, 10).map((t) => {
    const date = formatDateShort(t.dateCompleted) || "";
    const project = t.projectName ? ` — ${t.projectName}` : "";
    const priority =
      t.priority && t.priority !== "None"
        ? ` ${inlineCode(t.priority)}`
        : "";
    return `- ~~${t.task}~~${project}${priority} ${italic(date)}`;
  });

  return details(
    bold("Recent Completions"),
    joinLines(...items)
  );
}

// ── Metrics ──────────────────────────────────────────────────────────────────

function renderMetrics(stats) {
  if (stats.totalSessions === 0 && stats.totalProjects === 0) return null;

  const items = [];
  if (stats.totalProjects > 0)
    items.push(badge("Featured Projects", String(stats.totalProjects), "0969da?style=for-the-badge"));
  if (stats.totalSessions > 0)
    items.push(badge("Work Sessions", String(stats.totalSessions), "8250df?style=for-the-badge"));
  if (stats.totalHoursLogged > 0)
    items.push(badge("Hours Logged", String(stats.totalHoursLogged), "cf222e?style=for-the-badge"));
  if (stats.recentTaskCount > 0)
    items.push(badge("Tasks Done", String(stats.recentTaskCount), "2da44e?style=for-the-badge"));

  return joinLines(
    heading(2, "By the Numbers"),
    "",
    alignCenter(items.join("&ensp;"))
  );
}

// ── Links ────────────────────────────────────────────────────────────────────

function renderLinks(links) {
  if (!links.length) return null;

  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      const url = l.email ? `mailto:${l.email}` : l.url;
      return `[![${l.label}](${badgeUrl(l.label, "↗", "24292f")})](${url})`;
    });

  if (!items.length) return null;

  return joinLines(sectionDivider("gradient"), "", alignCenter(items.join("&ensp;")));
}

// ── Footer ───────────────────────────────────────────────────────────────────

function renderFooter() {
  return joinLines(
    "",
    sectionDivider("gradient"),
    "",
    alignCenter(
      `<sub>Generated from Notion · Pipeline: <code>update-profile</code></sub>`
    )
  );
}

module.exports = { generate };
