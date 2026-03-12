// Minimalist Retro — "Terminal Portfolio"
// Text-forward, monospaced flavor, retro-terminal aesthetic.
// ASCII sensibility with a terminal-inspired skills section,
// inline repo/download links, and a code-block contact block.

const {
  joinLines,
  blankLine,
  link,
  inlineCode,
  bold,
  italic,
  progressBar,
  formatDateShort,
  relativeTime,
  truncate,
  linkedBadge,
  resourceBadges,
  details,
} = require("../lib/renderer");
const { deriveSkills } = require("../lib/skills");

function generate(data) {
  const { projects, workLogs, milestones, links, stats } = data;

  const sections = [
    renderHero(),
    renderSystem(projects),
    renderProjects(projects),
    renderWorkLog(workLogs, stats),
    renderMilestones(milestones),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n---\n\n") + "\n";
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function renderHero() {
  return joinLines(
    "# Zachary Sturman",
    "",
    "```",
    "┌──────────────────────────────────────────────────────────────────┐",
    "│  Building tools that think clearly about how people work.       │",
    "│  Product engineer · Designer · Systems thinker                  │",
    "└──────────────────────────────────────────────────────────────────┘",
    "```"
  );
}

// ── System / Skills ──────────────────────────────────────────────────────────

function renderSystem(projects) {
  const skills = deriveSkills(projects);
  if (!skills.all.length) return null;

  const lines = ["```bash", "$ cat ~/.skills", ""];

  for (const [category, items] of skills.byCategory) {
    const names = items.map((s) => s.label).join(", ");
    lines.push(`  ${category.toUpperCase().padEnd(14)} ${names}`);
  }

  lines.push("", "```");

  return joinLines("## System", "", ...lines);
}

// ── Projects ─────────────────────────────────────────────────────────────────

function renderProjects(projects) {
  if (!projects.length) return null;

  const items = projects.map((p) => {
    const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
    const oneLiner = p.oneLiner ? ` — ${truncate(p.oneLiner, 100)}` : "";

    // Inline resource links
    const resourceLinks = (p.resources || [])
      .filter((r) => r.url)
      .map((r) => {
        const label = r.label || r.type || "link";
        return link(`\`${label}\``, r.url);
      });
    const downloadLink =
      p.downloadUrl && !resourceLinks.some((l) => l.includes("download"))
        ? link("`download`", p.downloadUrl)
        : null;
    const allLinks = [...resourceLinks];
    if (downloadLink) allLinks.push(downloadLink);
    const linksStr = allLinks.length ? "  " + allLinks.join(" ") : "";

    const tags = p.tags.length
      ? "\n  " + p.tags.map((t) => inlineCode(t)).join(" ")
      : "";

    return `> **${name}**${oneLiner}${linksStr}${tags}`;
  });

  return joinLines("## Projects", "", ...items);
}

// ── Work Log ─────────────────────────────────────────────────────────────────

function renderWorkLog(workLogs, stats) {
  if (!workLogs.length) return null;

  const entries = workLogs.slice(0, 7).map((log) => {
    const date = formatDateShort(log.date) || "—";
    const project = log.projectName || "—";
    const entry = truncate(log.entry || log.whatHappened, 50);
    const duration = log.duration ? `${String(log.duration).padStart(4)}m` : "    —";
    return `  ${date.padEnd(8)} ${project.padEnd(22)} ${duration} ${entry}`;
  });

  const statsLine =
    stats.sessionsLast30Days > 0
      ? `\n  ${stats.sessionsLast30Days} sessions · ${stats.hoursLast30Days}h logged in the last 30 days`
      : "";

  return joinLines(
    "## Recent Work",
    "",
    "```",
    "  DATE     PROJECT                 TIME ENTRY",
    "  ──────── ──────────────────────  ──── ──────────────────────────",
    ...entries,
    "```",
    statsLine
  );
}

// ── Milestones ───────────────────────────────────────────────────────────────

function renderMilestones(milestones) {
  if (!milestones.length) return null;

  const items = milestones.slice(0, 5).map((m) => {
    const pct = m.taskPercentComplete ?? 0;
    const bar = progressBar(pct, 16);
    const project = m.projectName ? ` (${m.projectName})` : "";
    const desc = m.description ? `\n  ${truncate(m.description, 80)}` : "";
    return `  ${m.milestone}${project}\n  ${bar}${desc}`;
  });

  return joinLines("## Active Milestones", "", ...items);
}

// ── Links ────────────────────────────────────────────────────────────────────

function renderLinks(links) {
  if (!links.length) return null;

  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      if (l.email) return `  ${l.label.padEnd(12)} ${l.email}`;
      return `  ${l.label.padEnd(12)} ${l.url}`;
    });

  if (!items.length) return null;

  return joinLines(
    "## Contact",
    "",
    "```",
    "  ┌─────────────────────────────────────────┐",
    ...items,
    "  └─────────────────────────────────────────┘",
    "```"
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function renderFooter() {
  const now = new Date().toISOString().split("T")[0];
  return joinLines(
    `<sub>Auto-generated from Notion · last sync: ${now}</sub>`
  );
}

module.exports = { generate };
