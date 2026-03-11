// Technical Showcase — "Engineering Dashboard"
// Data-rich, structured, tables, badges, metrics-forward.
// Feels like a project management status dashboard.

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
} = require("../lib/renderer");

function generate(data) {
  const { projects, workLogs, milestones, tasks, links, stats } = data;

  const sections = [
    renderHero(stats),
    renderProjects(projects),
    renderExecutionLog(workLogs),
    renderMilestones(milestones),
    renderRecentTasks(tasks),
    renderStats(stats),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

function renderHero(stats) {
  const badges = [];
  if (stats.totalProjects > 0) {
    badges.push(badge("projects", String(stats.totalProjects), "0969da"));
  }
  if (stats.activeMilestones > 0) {
    badges.push(badge("active milestones", String(stats.activeMilestones), "2da44e"));
  }
  if (stats.sessionsLast30Days > 0) {
    badges.push(
      badge("sessions (30d)", String(stats.sessionsLast30Days), "8250df")
    );
  }
  if (stats.hoursLast30Days > 0) {
    badges.push(
      badge("hours (30d)", String(stats.hoursLast30Days), "cf222e")
    );
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
    divider()
  );
}

function renderProjects(projects) {
  if (!projects.length) return null;

  const headers = ["Project", "Description", "Status", "Tags"];
  const rows = projects.map((p) => {
    const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
    const desc = truncate(p.oneLiner, 80);
    const status = [p.status, p.phase].filter(Boolean).join(" · ") || "—";
    const tags = p.tags.slice(0, 3).map((t) => inlineCode(t)).join(" ") || "—";
    return [name, desc, status, tags];
  });

  return joinLines(heading(2, "Projects"), "", table(headers, rows));
}

function renderExecutionLog(workLogs) {
  if (!workLogs.length) return null;

  const headers = ["Date", "Project", "Type", "Duration", "Entry"];
  const rows = workLogs.slice(0, 10).map((log) => {
    const date = formatDateShort(log.date) || "—";
    const project = log.projectName || "—";
    const type = log.sessionType || "—";
    const duration = log.duration ? `${log.duration}m` : "—";
    const entry = truncate(log.entry, 50);
    return [date, project, type, duration, entry];
  });

  return joinLines(heading(2, "Execution Log"), "", table(headers, rows));
}

function renderMilestones(milestones) {
  if (!milestones.length) return null;

  const headers = ["Milestone", "Project", "Progress", "Status"];
  const rows = milestones.map((m) => {
    const pct = m.taskPercentComplete ?? 0;
    const bar = `\`${progressBar(pct, 12)}\``;
    const project = m.projectName || "—";
    const status = m.isBlocked ? "🔴 Blocked" : m.status || "—";
    return [m.milestone, project, bar, status];
  });

  return joinLines(heading(2, "Active Milestones"), "", table(headers, rows));
}

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

function renderStats(stats) {
  if (stats.totalSessions === 0 && stats.totalProjects === 0) return null;

  const items = [];
  if (stats.totalProjects > 0)
    items.push(`**${stats.totalProjects}** featured projects`);
  if (stats.totalSessions > 0)
    items.push(`**${stats.totalSessions}** work sessions tracked`);
  if (stats.avgSessionMinutes > 0)
    items.push(`**${stats.avgSessionMinutes}m** avg session duration`);
  if (stats.recentTaskCount > 0)
    items.push(`**${stats.recentTaskCount}** tasks recently completed`);

  return joinLines(
    heading(2, "By the Numbers"),
    "",
    items.join("&ensp;&ensp;|&ensp;&ensp;")
  );
}

function renderLinks(links) {
  if (!links.length) return null;

  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      const url = l.email ? `mailto:${l.email}` : l.url;
      return `[![${l.label}](${badgeUrl(l.label, "↗", "24292f")})](${url})`;
    });

  if (!items.length) return null;

  return joinLines(divider(), "", alignCenter(items.join("&ensp;")));
}

function renderFooter() {
  return joinLines(
    "",
    divider(),
    "",
    alignCenter(
      `<sub>Generated from Notion · Pipeline: <code>update-profile</code></sub>`
    )
  );
}

module.exports = { generate };
