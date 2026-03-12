// Editorial Clean — "Magazine Layout"
// Narrative, generous whitespace, pull-quotes, editorial cards.
// Reads like a curated portfolio magazine page.
// Uses capsule-render hero, typing SVG, skillicons strip,
// 2-column project grid with resource badges, and icon-style links.

const {
  joinLines,
  blankLine,
  heading,
  bold,
  italic,
  blockquote,
  link,
  image,
  alignCenter,
  divider,
  formatDate,
  relativeTime,
  truncate,
  badge,
  linkedBadge,
  resourceBadges,
  capsuleImage,
  typingSvg,
  skillIconsImage,
  columns,
  sectionDivider,
  parseGitHubRepo,
} = require("../lib/renderer");
const { isStableImageUrl } = require("../lib/github-compat");
const { deriveSkills, renderSkillIconsUrl } = require("../lib/skills");

function generate(data) {
  const { projects, workLogs, links, stats } = data;

  const sections = [
    renderHero(),
    renderSkills(projects),
    renderProjects(projects),
    renderRecentWork(workLogs, stats),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function renderHero() {
  const header = capsuleImage({
    type: "waving",
    color: "0:667eea,100:764ba2",
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
    { color: "667eea", size: 20, duration: 3500, pause: 1200, width: 600 }
  );

  return joinLines(
    alignCenter(header),
    "",
    alignCenter(typing),
    "",
    sectionDivider("gradient")
  );
}

// ── Skills ───────────────────────────────────────────────────────────────────

function renderSkills(projects) {
  const skills = deriveSkills(projects);
  const iconsUrl = renderSkillIconsUrl(skills.all, { perline: 10, theme: "light" });
  if (!iconsUrl) return null;

  return joinLines(
    heading(2, "Tools & Technologies"),
    "",
    alignCenter(`<img src="${iconsUrl}" alt="Tech Stack" />`),
    ""
  );
}

// ── Projects ─────────────────────────────────────────────────────────────────

function renderProjects(projects) {
  if (!projects.length) return null;

  const cards = projects.map((p) => renderProjectCard(p));

  return joinLines(
    heading(2, "Selected Work"),
    "",
    columns(cards, 2)
  );
}

function renderProjectCard(p) {
  const title = p.repoLink ? link(bold(p.title), p.repoLink) : bold(p.title);
  const subtitle = p.subtitle ? `\n${italic(p.subtitle)}` : "";

  // Try hero → banner → thumbnail for the visual
  const imageUrl = pickBestImage(p);
  const visual = imageUrl
    ? `<img src="${imageUrl}" alt="${p.title}" width="100%" />\n\n`
    : "";

  const oneLiner = p.oneLiner ? `> ${truncate(p.oneLiner, 120)}\n` : "";

  // Resource link badges (repo, download, visit, etc.)
  const resBadges = resourceBadges(p.resources || [], "flat-square");

  // Download URL as fallback if no resource provides it
  const downloadBadge =
    !resBadges.includes("download") && p.downloadUrl
      ? linkedBadge("Download", p.downloadUrl, { logo: "download", color: "0969da" })
      : "";

  const links = [resBadges, downloadBadge].filter(Boolean).join(" ");

  const topTags = p.tags.slice(0, 4);
  const tags = topTags.length
    ? topTags.map((t) => badge(t, "", "eee")).join(" ")
    : "";

  const status =
    p.status && p.phase
      ? italic(`${p.status} · ${p.phase}`)
      : p.status
        ? italic(p.status)
        : "";

  return joinLines(
    visual,
    `### ${title}${subtitle}`,
    "",
    oneLiner,
    links,
    "",
    tags,
    status ? `\n${status}` : ""
  );
}

function pickBestImage(project) {
  const candidates = [
    project.heroPreview,
    project.bannerPreview,
    project.thumbnailPreview,
    project.posterPreview,
  ];
  return candidates.find((url) => isStableImageUrl(url)) || null;
}

// ── Recent Work ──────────────────────────────────────────────────────────────

function renderRecentWork(workLogs, stats) {
  if (!workLogs.length) return null;

  const entries = workLogs.slice(0, 5).map((log) => {
    const date = formatDate(log.date);
    const project = log.projectName ? bold(log.projectName) : "";
    const what = log.whatHappened || log.entry || "";
    const desc = truncate(what, 200);
    const duration = log.duration ? ` · ${italic(`${log.duration}m`)}` : "";

    if (project && date) {
      return joinLines(
        `**${date}** — ${project}${duration}`,
        "",
        desc,
        ""
      );
    }
    return joinLines(`**${date}**${duration}`, "", desc, "");
  });

  // Momentum badges
  const momentum = [];
  if (stats.sessionsLast30Days > 0) {
    momentum.push(badge("sessions", String(stats.sessionsLast30Days), "8250df"));
  }
  if (stats.hoursLast30Days > 0) {
    momentum.push(badge("hours", String(stats.hoursLast30Days), "cf222e"));
  }
  const momentumLine = momentum.length
    ? joinLines("", alignCenter(momentum.join("&ensp;")), "")
    : "";

  return joinLines(
    heading(2, "Recently"),
    "",
    ...entries,
    momentumLine
  );
}

// ── Links ────────────────────────────────────────────────────────────────────

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
      return linkedBadge(l.label, url, { logo, color: "24292f", style: "for-the-badge" });
    });

  if (!items.length) return null;

  return joinLines(
    sectionDivider("gradient"),
    "",
    alignCenter(items.join("&ensp;"))
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function renderFooter() {
  const footer = capsuleImage({
    type: "waving",
    color: "0:667eea,100:764ba2",
    height: 100,
    section: "footer",
  });

  return joinLines(
    "",
    alignCenter(
      `<sub>This page is generated from a Notion workspace and updates automatically.</sub>`
    ),
    "",
    alignCenter(footer)
  );
}

module.exports = { generate };
