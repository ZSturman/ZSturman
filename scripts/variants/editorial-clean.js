// Editorial Clean — "Magazine Layout"
// Narrative, generous whitespace, pull-quotes, editorial cards.
// Reads like a curated portfolio magazine page.
// Uses images where available, degrades gracefully to text.

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
} = require("../lib/renderer");
const { isStableImageUrl } = require("../lib/github-compat");

function generate(data) {
  const { projects, workLogs, links, stats } = data;

  const sections = [
    renderHero(),
    renderProjects(projects),
    renderRecentWork(workLogs, stats),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

function renderHero() {
  return joinLines(
    alignCenter(
      joinLines(
        "# Zachary Sturman",
        "",
        `${italic("Product engineer and designer building tools")}`,
        `${italic("that think clearly about how people work.")}`,
      )
    ),
    "",
    divider()
  );
}

function renderProjects(projects) {
  if (!projects.length) return null;

  const cards = projects.map((project) => renderProjectCard(project));

  return joinLines(
    "## Selected Work",
    "",
    ...cards
  );
}

function renderProjectCard(p) {
  const title = p.repoLink ? link(bold(p.title), p.repoLink) : bold(p.title);
  const subtitle = p.subtitle ? `  \n${italic(p.subtitle)}` : "";

  // Try hero → banner → thumbnail for the visual
  const imageUrl = pickBestImage(p);
  const visual = imageUrl
    ? joinLines(
        "",
        image(p.title, imageUrl, { width: "700", align: "center" }),
        ""
      )
    : "";

  const oneLiner = p.oneLiner ? joinLines("", blockquote(p.oneLiner), "") : "";

  const body = p.summary
    ? joinLines("", truncate(p.summary, 280), "")
    : "";

  const tags = p.tags.length
    ? joinLines(
        "",
        p.tags.map((t) => badge(t, "", "eee")).join(" "),
      )
    : "";

  const status =
    p.status && p.phase
      ? `\n\n${italic(`${p.status} · ${p.phase}`)}`
      : p.status
        ? `\n\n${italic(p.status)}`
        : "";

  return joinLines(
    "###" + " " + title + subtitle,
    visual,
    oneLiner,
    body,
    tags,
    status,
    "",
    divider(),
    ""
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

function renderRecentWork(workLogs, stats) {
  if (!workLogs.length) return null;

  const entries = workLogs.slice(0, 5).map((log) => {
    const date = formatDate(log.date);
    const project = log.projectName ? bold(log.projectName) : "";
    const what = log.whatHappened || log.entry || "";
    const desc = truncate(what, 200);

    if (project && date) {
      return joinLines(
        `**${date}** — ${project}`,
        "",
        desc,
        ""
      );
    }
    return joinLines(`**${date}**`, "", desc, "");
  });

  const statsLine =
    stats.sessionsLast30Days > 0
      ? `\n${italic(
          `${stats.sessionsLast30Days} sessions and ${stats.hoursLast30Days} hours in the last 30 days.`
        )}\n`
      : "";

  return joinLines(
    "## Recently",
    "",
    ...entries,
    statsLine
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
    alignCenter(items.join("&ensp;·&ensp;"))
  );
}

function renderFooter() {
  return joinLines(
    "",
    alignCenter(
      `<sub>This page is generated from a Notion workspace and updates automatically.</sub>`
    )
  );
}

module.exports = { generate };
