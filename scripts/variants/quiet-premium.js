// Quiet Premium — "Luxury Minimal"
// Maximum restraint. Only essential information. Extreme negative space.
// Apple-style presentation — says more by showing less.
// Top 3 projects max. Icon-only link badges. Capsule-render accents.
// Every element earns its place.

const {
  joinLines,
  bold,
  italic,
  link,
  image,
  alignCenter,
  divider,
  blockquote,
  linkedBadge,
  resourceBadges,
  capsuleImage,
  sectionDivider,
} = require("../lib/renderer");
const { isStableImageUrl } = require("../lib/github-compat");
const { deriveSkills } = require("../lib/skills");

function generate(data) {
  const { projects, workLogs, links } = data;

  const sections = [
    renderHero(projects),
    renderProjects(projects),
    renderCurrentWork(workLogs),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function renderHero(projects) {
  const header = capsuleImage({
    type: "waving",
    color: "0:e8e8e8,100:f5f5f5",
    height: 120,
    section: "header",
  });

  // Weave key skills into the tagline
  const skills = deriveSkills(projects);
  const topSkills = skills.all
    .filter((s) => ["Languages", "Frameworks"].includes(s.category))
    .slice(0, 3)
    .map((s) => s.label);
  const skillLine = topSkills.length
    ? topSkills.join(" · ")
    : "";

  // Try to find a hero image from the top project
  const heroUrl = findHeroImage(projects);
  const visual = heroUrl
    ? joinLines(
        "",
        `<br>`,
        "",
        alignCenter(`<img src="${heroUrl}" alt="" width="85%" />`),
        "",
        `<br>`,
        ""
      )
    : "\n<br>\n";

  return joinLines(
    alignCenter(header),
    "",
    alignCenter(
      joinLines(
        "",
        "# Zachary Sturman",
        "",
        italic(`Design-minded product engineer.${skillLine ? `  \n${skillLine}` : ""}`),
        ""
      )
    ),
    visual
  );
}

function findHeroImage(projects) {
  for (const p of projects.slice(0, 3)) {
    const candidates = [p.heroPreview, p.bannerPreview, p.posterPreview];
    const stable = candidates.find((url) => isStableImageUrl(url));
    if (stable) return stable;
  }
  return null;
}

// ── Projects ─────────────────────────────────────────────────────────────────

function renderProjects(projects) {
  if (!projects.length) return null;

  const top = projects.slice(0, 3);
  const items = top.map((p) => {
    const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
    const desc = p.oneLiner || "";

    // Show hero/banner image per project if available
    const imageUrl = findProjectImage(p);
    const visual = imageUrl
      ? joinLines(
          "",
          alignCenter(`<img src="${imageUrl}" alt="${p.title}" width="75%" />`),
          "",
          "<br>",
          ""
        )
      : "";

    // 1-2 monochrome resource buttons
    const resBadges = (p.resources || [])
      .filter((r) => r.url)
      .slice(0, 2)
      .map((r) =>
        linkedBadge(r.label || r.type, r.url, {
          logo: r.icon === "github" ? "github" : r.icon === "apple" ? "apple" : "link",
          color: "f5f5f5",
          logoColor: "333",
          style: "flat-square",
        })
      )
      .join("&ensp;");

    return joinLines(
      visual,
      alignCenter(
        joinLines(
          "",
          `### ${name}`,
          "",
          desc,
          "",
          resBadges,
          ""
        )
      ),
      "",
      "<br>"
    );
  });

  return joinLines(
    sectionDivider("gradient"),
    "",
    ...items
  );
}

function findProjectImage(project) {
  const candidates = [project.heroPreview, project.bannerPreview, project.thumbnailPreview];
  return candidates.find((url) => isStableImageUrl(url)) || null;
}

// ── Current Work ─────────────────────────────────────────────────────────────

function renderCurrentWork(workLogs) {
  if (!workLogs.length) return null;

  const latest = workLogs[0];
  const project = latest.projectName;
  if (!project) return null;

  return joinLines(
    sectionDivider("gradient"),
    "",
    "<br>",
    "",
    alignCenter(blockquote(`Currently working on ${bold(project)}.`)),
    "",
    "<br>"
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
  };

  // Icon-only badges: use logo with no label text for extreme minimal feel
  const items = links
    .filter((l) => l.url || l.email)
    .map((l) => {
      const url = l.email ? `mailto:${l.email}` : l.url;
      const labelLower = (l.label || "").toLowerCase();
      const logo = LINK_ICONS[labelLower] || "link";
      // Render as icon-only: label is space so badge renders just the logo
      return `[![${l.label}](https://img.shields.io/badge/${encodeURIComponent(" ")}-f5f5f5?style=for-the-badge&logo=${logo}&logoColor=333)](${url})`;
    });

  if (!items.length) return null;

  return joinLines(
    sectionDivider("gradient"),
    "",
    "<br>",
    "",
    alignCenter(items.join("&emsp;&emsp;")),
    "",
    "<br>"
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function renderFooter() {
  const footer = capsuleImage({
    type: "waving",
    color: "0:f5f5f5,100:e8e8e8",
    height: 80,
    section: "footer",
  });

  return joinLines(
    "",
    alignCenter(`<sub>Synced from Notion.</sub>`),
    "",
    alignCenter(footer)
  );
}

module.exports = { generate };
