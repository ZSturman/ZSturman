// Minimalist Retro — "Terminal Portfolio"
// Text-forward, monospaced flavor, retro-terminal aesthetic.
// No images, no badges, no tables. Pure text hierarchy.
// Feels like reading a well-organized dotfiles README.

const {
  joinLines,
  blankLine,
  link,
  inlineCode,
  progressBar,
  formatDateShort,
  relativeTime,
  truncate,
} = require("../lib/renderer");

function generate(data) {
  const { projects, workLogs, milestones, links, stats } = data;

  const sections = [
    renderHero(),
    renderProjects(projects),
    renderWorkLog(workLogs, stats),
    renderMilestones(milestones),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n---\n\n") + "\n";
}

function renderHero() {
  return joinLines(
    "# Zachary Sturman",
    "",
    "```",
    "Building tools that think clearly about how people work.",
    "Product engineer · Designer · Systems thinker",
    "```"
  );
}

function renderProjects(projects) {
  if (!projects.length) return null;

  const items = projects.map((p) => {
    const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
    const tags = p.tags.length
      ? "  " + p.tags.map((t) => inlineCode(t)).join(" ")
      : "";
    const oneLiner = p.oneLiner ? ` — ${p.oneLiner}` : "";
    return `> **${name}**${oneLiner}${tags}`;
  });

  return joinLines("## Projects", "", ...items);
}

function renderWorkLog(workLogs, stats) {
  if (!workLogs.length) return null;

  const entries = workLogs.slice(0, 7).map((log) => {
    const date = formatDateShort(log.date) || "—";
    const project = log.projectName || "—";
    const entry = truncate(log.entry || log.whatHappened, 60);
    return `  ${date.padEnd(8)} ${project.padEnd(22)} ${entry}`;
  });

  const statsLine =
    stats.sessionsLast30Days > 0
      ? `\n  ${stats.sessionsLast30Days} sessions · ${stats.hoursLast30Days}h logged in the last 30 days`
      : "";

  return joinLines(
    "## Recent Work",
    "",
    "```",
    "  DATE     PROJECT                ENTRY",
    "  ──────── ────────────────────── ────────────────────────────────",
    ...entries,
    "```",
    statsLine
  );
}

function renderMilestones(milestones) {
  if (!milestones.length) return null;

  const items = milestones.slice(0, 5).map((m) => {
    const pct = m.taskPercentComplete ?? 0;
    const bar = progressBar(pct, 16);
    const project = m.projectName ? ` (${m.projectName})` : "";
    return `  ${m.milestone}${project}\n  ${bar}`;
  });

  return joinLines("## Active Milestones", "", ...items);
}

function renderLinks(links) {
  if (!links.length) return null;

  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      if (l.email) return link(l.label, `mailto:${l.email}`);
      return link(l.label, l.url);
    });

  if (!items.length) return null;
  return items.join(" · ");
}

function renderFooter() {
  return joinLines(
    "<sub>Auto-generated from Notion. Updated on a rolling schedule.</sub>"
  );
}

module.exports = { generate };
