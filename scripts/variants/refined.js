// Refined — "Curated Blend"
// Combines the best elements from all five existing variants based on
// explicit design preferences. Blue/grey colour palette, animated header,
// prominent projects with collapsible details, hybrid work log table,
// enhanced milestones with resource links, icon+text contact badges,
// and a friendly auto-generated footer.

const {
  joinLines,
  heading,
  bold,
  italic,
  inlineCode,
  link,
  blockquote,
  badge,
  progressBar,
  table,
  details,
  alignCenter,
  formatDateShort,
  truncate,
  linkedBadge,
  resourceBadges,
  capsuleImage,
  typingSvg,
  sectionDivider,
} = require("../lib/renderer");

// ── Colour palette (muted blue-grey) ────────────────────────────────────────

const GRADIENT = "0:6b7b8d,100:8e9eab";
const GRADIENT_REV = "0:8e9eab,100:6b7b8d";
const ACCENT_COLOR = "6b7b8d"; // for badges & typography SVG

function gradientDivider() {
  return `<img src="https://capsule-render.vercel.app/api?type=rect&color=${encodeURIComponent(GRADIENT)}&height=2&section=header" width="100%" />`;
}

// ── Entry point ──────────────────────────────────────────────────────────────

function generate(data) {
  const { projects, workLogs, milestones, links, stats } = data;

  const sections = [
    renderHero(),
    renderStats(),
    renderProjects(projects),
    renderRecentWork(workLogs),
    renderMilestones(milestones),
    renderLinks(links),
    renderFooter(links),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

// ── Section 1 — Hero / Header ────────────────────────────────────────────────

function renderHero() {
  const header = capsuleImage({
    type: "waving",
    color: GRADIENT,
    height: 220,
    section: "header",
    text: "Zachary Sturman",
    fontSize: 50,
    fontColor: "ffffff",
    desc: "product engineer · designer · systems thinker",
    descSize: 18,
    descAlignY: 75,
  });

  const typing = typingSvg(
    [
      "Building tools that think clearly about how people work",
      "iOS apps, automation systems, and cognitive architectures",
      "Design-minded engineering with attention to craft",
    ],
    { color: ACCENT_COLOR, size: 20, duration: 3500, pause: 1200, width: 600 }
  );

  return joinLines(
    alignCenter(header),
    "",
    alignCenter(typing),
    "",
    gradientDivider()
  );
}

// ── Section 2 — Top Languages ───────────────────────────────────────────────

function renderStats() {
  // Top languages card (compact layout)
  const langsUrl =
    "https://github-readme-stats.vercel.app/api/top-langs/" +
    "?username=ZSturman&theme=transparent&layout=compact" +
    "&hide_border=true&langs_count=8";

  return joinLines(
    alignCenter(
      joinLines(
        "",
        `![Top Languages](${langsUrl})`,
        ""
      )
    )
  );
}

// ── Section 3 — Projects ────────────────────────────────────────────────────

function renderProjects(projects) {
  if (!projects.length) return null;

  const items = projects.map((p) => renderProjectEntry(p));

  // Join projects with a horizontal rule (with blank lines around it for correct rendering)
  return "## Selected Work\n\n" + items.join("\n\n---\n\n");
}

function renderProjectEntry(p) {
  // Build parts array — each element becomes a paragraph separated by blank lines
  const parts = [];

  // Title — prominent, linked if repo available, with status+phase inline
  const repoUrl = findRepoUrl(p);
  const titleText = repoUrl ? link(bold(p.title), repoUrl) : bold(p.title);
  const statusPhase = [p.status, p.phase].filter(Boolean).join(" · ");
  const statusSpan = statusPhase
    ? ` <sub><sup style="color:#999">${statusPhase}</sup></sub>`
    : "";
  parts.push(`### ${titleText}${statusSpan}`);

  // Resource link badges (shown prominently after status)
  const resBadges = resourceBadges(p.resources || [], "flat-square");
  const downloadBadge =
    !resBadges.includes("download") && p.downloadUrl
      ? linkedBadge("Download", p.downloadUrl, {
          logo: "download",
          color: "0969da",
        })
      : "";
  const badgeLine = [resBadges, downloadBadge].filter(Boolean).join(" ");
  if (badgeLine) parts.push(badgeLine);

  // One liner — always visible
  if (p.oneLiner) parts.push(`> ${p.oneLiner}`);

  // Collapsible summary / description
  if (p.summary) {
    // Sanitize newlines so they don't break the blockquote/callout
    const cleanSummary = p.summary.replace(/\n+/g, " ").trim();
    parts.push(details("More details", `> ${cleanSummary}`));
  }

  // Double newlines between parts ensures proper markdown paragraph separation
  return parts.join("\n\n");
}

// ── Section 4 — Recent Work (table hybrid) ──────────────────────────────────

function renderRecentWork(workLogs) {
  if (!workLogs.length) return null;

  const headers = ["Date", "Duration", "Project", "Entry", "What Happened"];
  const rows = workLogs.slice(0, 7).map((log) => {
    const date = formatDateShort(log.sessionStart || log.date) || "—";
    const duration = formatDuration(log.duration);
    const project = log.projectName || "—";
    const entry = truncate(log.entry || "", 50);
    const whatHappened = truncate(log.whatHappened || "", 60);
    return [date, duration, project, entry, whatHappened];
  });

  return joinLines(
    heading(2, "Recent Work"),
    "",
    table(headers, rows)
  );
}

// ── Section 5 — Active Milestones (table, no Gantt, no links column) ────────

function renderMilestones(milestones) {
  if (!milestones.length) return null;

  const headers = ["Milestone", "Project", "Progress", "Status"];
  const rows = milestones.map((m) => {
    const pct = m.taskPercentComplete ?? 0;
    const bar = `\`${progressBar(pct, 12)}\``;
    const project = m.projectName || "—";
    const status = m.isBlocked ? "⚠ Blocked" : m.status || "In Progress";

    return [bold(m.milestone), project, bar, status];
  });

  return joinLines(heading(2, "Active Milestones"), "", table(headers, rows));
}

// ── Section 6 — Contact / Links ─────────────────────────────────────────────

function renderLinks(links) {
  if (!links.length) return null;

  const LINK_ICONS = {
    portfolio: "googlechrome",
    website: "googlechrome",
    email: "gmail",
    github: "github",
    linkedin: "linkedin",
    hashnode: "hashnode",
    twitter: "twitter",
    dev: "devdotto",
  };

  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      const url = l.email ? `mailto:${l.email}` : l.url;
      const labelLower = (l.label || "").toLowerCase();
      const logo = LINK_ICONS[labelLower] || "link";
      return linkedBadge(l.label, url, {
        logo,
        color: "24292f",
        style: "for-the-badge",
      });
    });

  if (!items.length) return null;

  return joinLines(
    gradientDivider(),
    "",
    alignCenter(items.join("&ensp;"))
  );
}

// ── Section 7 — Footer ──────────────────────────────────────────────────────

function renderFooter(links) {
  // Find a contact URL for "reach out"
  const emailLink = links.find((l) => l.email);
  const portfolioLink = links.find(
    (l) => (l.label || "").toLowerCase() === "portfolio" && l.url
  );
  const reachOutUrl = emailLink
    ? `mailto:${emailLink.email}`
    : portfolioLink
      ? portfolioLink.url
      : null;

  const reachOut = reachOutUrl
    ? ` To learn more about how this works, ${link("reach out", reachOutUrl)}.`
    : "";

  const footer = capsuleImage({
    type: "waving",
    color: GRADIENT_REV,
    height: 100,
    section: "footer",
  });

  return joinLines(
    "",
    alignCenter(
      `<sub>This page is generated from a Notion workspace and updates automatically.${reachOut}</sub>`
    ),
    "",
    alignCenter(footer)
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findRepoUrl(project) {
  if (project.repoLink) return project.repoLink;
  // Fall back to resources: prefer type 'repo', then others
  const resources = project.resources || [];
  const repo = resources.find((r) => r.type === "repo" && r.url);
  if (repo) return repo.url;
  const fallback = resources.find((r) => r.url);
  return fallback ? fallback.url : null;
}

function formatDuration(minutes) {
  if (typeof minutes !== "number" || Number.isNaN(minutes) || minutes <= 0) {
    return "—";
  }

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainder = roundedMinutes % 60;

  if (!hours) return `${roundedMinutes}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

module.exports = { generate };
