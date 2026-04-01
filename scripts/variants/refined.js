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
  const { projects, workLogs, milestones, links, wakatime } = data;

  const sections = [
    safeRender(() => renderHero(), "hero"),
    safeRender(() => renderProjects(projects), "projects"),
    safeRender(() => renderRecentWork(workLogs, projects, wakatime), "recentWork"),
    safeRender(() => renderMilestones(milestones), "milestones"),
    safeRender(() => renderLinks(links), "links"),
    safeRender(() => renderFooter(links), "footer"),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

/**
 * Wrap a render function so that failures are logged and the section is omitted.
 */
function safeRender(fn, label) {
  try {
    const result = fn();
    return result || null;
  } catch (err) {
    console.warn(`Section "${label}" skipped — ${err.message}`);
    return null;
  }
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
      "Building tools with humans in the loop",
      "Automation systems and cognitive architectures",
      "Design-minded engineering",
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

// ── Recent Work activity snapshot ────────────────────────────────────────────

function renderActivitySnapshot(wakatime) {
  if (!wakatime) return null;

  const parts = [];
  const rangeName = wakatime.human_readable_range || "last 30 days";

  const totalText = wakatime.human_readable_total_including_other_language
    || wakatime.human_readable_total
    || null;
  const dailyAvg = wakatime.human_readable_daily_average_including_other_language
    || wakatime.human_readable_daily_average
    || null;
  const bestDay = formatBestDay(wakatime.best_day);

  parts.push(`**${rangeName} coding snapshot**`);

  if (totalText || dailyAvg) {
    const summaryItems = [];
    if (totalText) summaryItems.push(`${bold(totalText)} total`);
    if (dailyAvg) summaryItems.push(`${bold(dailyAvg)} daily avg`);
    if (bestDay) summaryItems.push(`best day ${bestDay}`);
    parts.push(blockquote(summaryItems.join(" · ")));
  } else if (bestDay) {
    parts.push(blockquote(`best day ${bestDay}`));
  }

  const lineChanges = formatLineChangeSummary(wakatime);
  if (lineChanges) {
    parts.push(blockquote(lineChanges));
  }

  const languagesTable = renderRankTable("Language", wakatime.languages, 6, { maxLabelLength: 20 });
  if (languagesTable) {
    parts.push("**Languages**");
    parts.push(languagesTable);
  }

  const projectsTable = renderRankTable("Project", wakatime.projects, 5, { maxLabelLength: 28 });
  if (projectsTable) {
    parts.push("**Projects**");
    parts.push(projectsTable);
  }

  const contextTable = renderContextTable(wakatime);
  if (contextTable) {
    parts.push("**Environment**");
    parts.push(contextTable);
  }

  if (parts.length === 1 && parts[0] === `**${rangeName} coding snapshot**`) {
    return null;
  }

  return parts.join("\n\n");
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

// ── Section 4 — Recent Work (table hybrid + activity snapshot) ──────────────

function renderRecentWork(workLogs, projects, wakatime) {
  const recentLogs = Array.isArray(workLogs) ? workLogs : [];
  const projectsList = Array.isArray(projects) ? projects : [];
  const activitySnapshot = renderActivitySnapshot(wakatime);

  if (!recentLogs.length && !activitySnapshot) return null;

  const projectsById = new Map(projectsList.map((project) => [project.id, project]));
  const items = recentLogs
    .slice(0, 7)
    .map((log, index) => renderWorkLogEntry(log, projectsById, index === 0));

  const body = [];
  if (items.length) {
    body.push(items.join("\n\n"));
  }
  if (activitySnapshot) {
    body.push(activitySnapshot);
  }

  return `${heading(2, "Recent Work")}\n\n${body.join("\n\n")}`;
}

function renderWorkLogEntry(log, projectsById, isOpen = false) {
  const summaryParts = [
    `<strong>${escapeHtml(formatDateShort(log.sessionStart || log.date) || "—")}</strong>`,
    escapeHtml(log.projectName || "Independent work"),
  ];

  const duration = formatDuration(log.duration);
  if (duration !== "—") {
    summaryParts.push(`<code>${escapeHtml(duration)}</code>`);
  }

  if (log.entry) {
    summaryParts.push(escapeHtml(log.entry));
  }

  const content = [];
  const projectResources = collectWorkLogResources(log, projectsById);

  if (log.whatHappened) {
    content.push(blockquote(log.whatHappened.trim()));
  }

  if (log.nextStep) {
    content.push(renderCallout("NOTE", "Next Step", log.nextStep.trim()));
  }

  if (log.problems) {
    content.push(renderCallout("WARNING", "Problems", log.problems.trim()));
  }

  if (projectResources.length) {
    content.push(renderCallout("TIP", "Public resources", resourceBadges(projectResources, "flat-square")));
  }

  return `<details${isOpen ? " open" : ""}>\n<summary>${summaryParts.join(" · ")}</summary>\n\n${content.join("\n\n")}\n\n</details>`;
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

function collectWorkLogResources(log, projectsById) {
  const seen = new Set();
  const resources = [];

  for (const projectId of log.projectIds || []) {
    const project = projectsById.get(projectId);
    for (const resource of project?.resources || []) {
      if (!resource?.url || seen.has(resource.id)) continue;
      seen.add(resource.id);
      resources.push(resource);
    }
  }

  return resources;
}

function renderRankTable(label, items, limit, options = {}) {
  const rows = (items || [])
    .filter((item) => item && item.name && ((item.percent || 0) > 0 || (item.total_seconds || 0) > 0))
    .slice(0, limit)
    .map((item) => {
      const pct = Math.round(item.percent || 0);
      const name = sanitizeTableCell(truncate(item.name, options.maxLabelLength || 24));
      const time = sanitizeTableCell(item.text || item.digital || "—");
      const share = inlineCode(progressBar(pct, 12));
      return [name, time, share];
    });

  if (!rows.length) return null;

  return table([label, "Time", "Share"], rows);
}

function renderContextTable(wakatime) {
  const editors = formatCompactBreakdown(wakatime.editors, 3, 20);
  const systems = formatCompactBreakdown(wakatime.operating_systems, 2, 18);
  const workTypes = formatCompactBreakdown(wakatime.categories, 3, 18);

  if (!editors && !systems && !workTypes) return null;

  return table(
    ["Editors", "Systems", "Work Types"],
    [[editors || "—", systems || "—", workTypes || "—"]]
  );
}

function formatCompactBreakdown(items, limit, maxLabelLength) {
  const lines = (items || [])
    .filter((item) => item && item.name && ((item.percent || 0) > 0 || (item.total_seconds || 0) > 0))
    .slice(0, limit)
    .map((item) => {
      const name = sanitizeTableCell(truncate(item.name, maxLabelLength));
      const pct = Math.round(item.percent || 0);
      const pctText = pct > 0 ? `${pct}%` : sanitizeTableCell(item.text || "—");
      return `${name} · ${pctText}`;
    });

  return lines.length ? lines.join("<br>") : null;
}

function formatBestDay(bestDay) {
  if (!bestDay) return null;

  const label = formatCalendarDay(bestDay.date);
  const total = bestDay.text || null;

  if (label && total) {
    return `${bold(label)} (${sanitizeText(total)})`;
  }
  if (label) {
    return bold(sanitizeText(label));
  }
  if (total) {
    return bold(sanitizeText(total));
  }

  return null;
}

function formatCalendarDay(dateText) {
  if (!dateText) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText));
  if (match) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[Number(match[2]) - 1];
    const day = String(Number(match[3]));
    return month ? `${month} ${day}` : String(dateText);
  }

  return formatDateShort(dateText) || String(dateText);
}

function formatLineChangeSummary(wakatime) {
  const typed = formatLineChangePair("Typed lines", wakatime.human_additions, wakatime.human_deletions);
  const assisted = formatLineChangePair("AI-assisted lines", wakatime.ai_additions, wakatime.ai_deletions);
  const parts = [typed, assisted].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function formatLineChangePair(label, additions, deletions) {
  const add = formatCount(additions, "+");
  const remove = formatCount(deletions, "-");
  const parts = [add, remove].filter(Boolean);
  return parts.length ? `${label} ${parts.join(" / ")}` : null;
}

function formatCount(value, prefix = "") {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return null;
  }

  return `${prefix}${value.toLocaleString("en-US")}`;
}

function sanitizeTableCell(text) {
  return sanitizeText(text).replace(/\|/g, "\\|");
}

function sanitizeText(text) {
  return escapeHtml(String(text || "").replace(/\n+/g, " ").trim());
}

function renderCallout(type, title, body) {
  const ICONS = {
    NOTE: "/",
    WARNING: "!",
    TIP: "?",
  };

  const icon = ICONS[type] || "ℹ";
  const lines = [`> ${icon} **${title}**`];

  for (const line of String(body || "").split("\n")) {
    lines.push(line.trim() ? `> ${line}` : ">");
  }

  return lines.join("\n");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

module.exports = { generate };
