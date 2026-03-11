// Systems Focused — "Connected Studio"
// Shows interconnection between projects, milestones, and ongoing work.
// Studio/agency portfolio feel with rich contextual layering.
// Uses collapsible details for depth without visual clutter.

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
} = require("../lib/renderer");
const { isStableImageUrl } = require("../lib/github-compat");

function generate(data) {
  const { projects, workLogs, milestones, tasks, links, stats } = data;

  const sections = [
    renderHero(projects),
    renderCurrentFocus(milestones),
    renderProjectShowcase(projects),
    renderStudioActivity(workLogs, stats),
    renderNextUp(tasks),
    renderLinks(links),
    renderFooter(),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

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

function renderProjectShowcase(projects) {
  if (!projects.length) return null;

  // Group by category if categories exist, otherwise flat list
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

  // Collapsible detail with summary, images, and fuller description
  const expandedParts = [];
  if (p.summary) expandedParts.push(p.summary);

  const imageUrl = pickBestImage(p);
  if (imageUrl) {
    expandedParts.push(image(p.title, imageUrl, { width: "600", align: "center" }));
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
  if (p.downloadUrl) {
    expandedParts.push(link("Download →", p.downloadUrl));
  }

  const expandable =
    expandedParts.length > 0
      ? "\n" + details("More details", joinLines(...expandedParts))
      : "";

  return joinLines(
    `${title}${subtitle}${statusLine}${tags}`,
    p.oneLiner ? `${p.oneLiner}` : "",
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

function renderStudioActivity(workLogs, stats) {
  if (!workLogs.length) return null;

  // Build a text-based timeline visualization
  const recentLogs = workLogs.slice(0, 8);
  const timelineEntries = recentLogs.map((log) => {
    const date = formatDateShort(log.date) || "—";
    const project = log.projectName ? bold(log.projectName) : "";
    const entry = truncate(log.entry || log.whatHappened, 80);
    const duration = log.duration ? `${log.duration}m` : "";
    const type = log.sessionType ? inlineCode(log.sessionType) : "";

    return `◆ **${date}** ${project} ${type}\n  ${entry} ${duration ? italic(`(${duration})`) : ""}`;
  });

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
    statsLine
  );
}

function renderNextUp(tasks) {
  if (!tasks.length) return null;

  const items = tasks.slice(0, 6).map((t) => {
    const project = t.projectName ? ` (${t.projectName})` : "";
    const date = t.dateCompleted ? ` — ${formatDateShort(t.dateCompleted)}` : "";
    return `- ~~${t.task}~~${project}${date}`;
  });

  return details(
    `${bold("Recently Completed")} — ${tasks.length} tasks`,
    joinLines(...items)
  );
}

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

function renderFooter() {
  return joinLines(
    "",
    `<sub>This profile is generated from an interconnected Notion workspace — projects, milestones, work logs, and tasks feed into a single pipeline that renders this page.</sub>`
  );
}

module.exports = { generate };
