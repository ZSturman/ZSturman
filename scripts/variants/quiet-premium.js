// Quiet Premium — "Luxury Minimal"
// Maximum restraint. Only essential information. Extreme negative space.
// Apple-style presentation — says more by showing less.
// Top 3 projects max. No tables, no badges, no milestones, no tasks.

const {
  joinLines,
  bold,
  italic,
  link,
  image,
  alignCenter,
  divider,
} = require("../lib/renderer");
const { isStableImageUrl } = require("../lib/github-compat");

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

function renderHero(projects) {
  // Try to find a hero image from the top project
  const heroUrl = findHeroImage(projects);
  const visual = heroUrl
    ? joinLines(
        "",
        image("", heroUrl, { width: "100%", align: "center" }),
        ""
      )
    : "";

  return joinLines(
    alignCenter(
      joinLines(
        "",
        "# Zachary Sturman",
        "",
        italic("Design-minded product engineer."),
        ""
      )
    ),
    visual
  );
}

function findHeroImage(projects) {
  for (const p of projects.slice(0, 3)) {
    const candidates = [
      p.heroPreview,
      p.bannerPreview,
      p.posterPreview,
    ];
    const stable = candidates.find((url) => isStableImageUrl(url));
    if (stable) return stable;
  }
  return null;
}

function renderProjects(projects) {
  if (!projects.length) return null;

  const top = projects.slice(0, 3);
  const items = top.map((p) => {
    const name = p.repoLink ? link(p.title, p.repoLink) : p.title;
    const desc = p.oneLiner || "";
    return joinLines(
      alignCenter(
        joinLines(
          "",
          `### ${name}`,
          "",
          desc,
          ""
        )
      )
    );
  });

  return joinLines(
    divider(),
    "",
    ...items
  );
}

function renderCurrentWork(workLogs) {
  if (!workLogs.length) return null;

  const latest = workLogs[0];
  const project = latest.projectName;
  if (!project) return null;

  return joinLines(
    divider(),
    "",
    alignCenter(
      italic(`Currently working on ${bold(project)}.`)
    )
  );
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

  return joinLines(
    divider(),
    "",
    alignCenter(items.join("&emsp;&emsp;"))
  );
}

function renderFooter() {
  return joinLines(
    "",
    "",
    alignCenter(
      `<sub>Synced from Notion.</sub>`
    )
  );
}

module.exports = { generate };
