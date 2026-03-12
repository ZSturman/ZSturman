// Shared markdown rendering helpers for GitHub profile READMEs.
// All output is GitHub-flavored markdown / GitHub-safe HTML.

const { isStableImageUrl } = require("./github-compat");

// ── Text formatting ──────────────────────────────────────────────────────────

function heading(level, text) {
  return `${"#".repeat(level)} ${text}`;
}

function bold(text) {
  return `**${text}**`;
}

function italic(text) {
  return `*${text}*`;
}

function inlineCode(text) {
  return `\`${text}\``;
}

function blockquote(text) {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function link(text, url) {
  if (!url) return text;
  return `[${text}](${url})`;
}

function divider() {
  return "---";
}

// ── Shields.io badges ────────────────────────────────────────────────────────

function badge(label, value, color = "333") {
  const l = encodeURIComponent(label.replace(/-/g, "--"));
  const v = encodeURIComponent(value.replace(/-/g, "--"));
  const c = encodeURIComponent(color);
  return `![${label}: ${value}](https://img.shields.io/badge/${l}-${v}-${c}?style=flat-square)`;
}

function badgeUrl(label, value, color = "333") {
  const l = encodeURIComponent(label.replace(/-/g, "--"));
  const v = encodeURIComponent(value.replace(/-/g, "--"));
  const c = encodeURIComponent(color);
  return `https://img.shields.io/badge/${l}-${v}-${c}?style=flat-square`;
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function progressBar(percent, width = 20) {
  const p = Math.max(0, Math.min(100, percent || 0));
  const filled = Math.round((p / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `${bar} ${Math.round(p)}%`;
}

// ── Tables ───────────────────────────────────────────────────────────────────

function table(headers, rows) {
  if (!headers.length) return "";
  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows
    .map((row) => `| ${row.map((cell) => String(cell ?? "")).join(" | ")} |`)
    .join("\n");
  return [headerRow, separatorRow, bodyRows].join("\n");
}

// ── Images ───────────────────────────────────────────────────────────────────

function image(alt, url, options = {}) {
  if (!url || !isStableImageUrl(url)) {
    return options.fallback || "";
  }

  const { width, height, align } = options;
  const attrs = [`src="${url}"`, `alt="${alt}"`];
  if (width) attrs.push(`width="${width}"`);
  if (height) attrs.push(`height="${height}"`);

  const img = `<img ${attrs.join(" ")} />`;

  if (align) {
    return `<div align="${align}">${img}</div>`;
  }
  return img;
}

// ── Layout ───────────────────────────────────────────────────────────────────

function alignCenter(content) {
  return `<div align="center">\n\n${content}\n\n</div>`;
}

function details(summary, content) {
  return `<details>\n<summary>${summary}</summary>\n\n${content}\n\n</details>`;
}

// ── Date formatting ──────────────────────────────────────────────────────────

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateShort(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relativeTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ── Text utilities ───────────────────────────────────────────────────────────

function truncate(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

function joinLines(...lines) {
  return lines.filter((l) => l != null && l !== "").join("\n");
}

function blankLine() {
  return "";
}

// ── Linked badges ────────────────────────────────────────────────────────────

function linkedBadge(label, url, options = {}) {
  if (!url) return "";
  const { logo, logoColor = "white", color = "24292f", style = "flat-square", message } = options;
  const l = encodeURIComponent(label.replace(/-/g, "--"));
  const msg = message ? encodeURIComponent(message.replace(/-/g, "--")) : "";
  const logoParam = logo ? `&logo=${encodeURIComponent(logo)}&logoColor=${logoColor}` : "";
  const badgePart = msg
    ? `https://img.shields.io/badge/${l}-${msg}-${color}?style=${style}${logoParam}`
    : `https://img.shields.io/badge/${l}-${color}?style=${style}${logoParam}`;
  return `[![${label}](${badgePart})](${url})`;
}

// ── Resource link badges ─────────────────────────────────────────────────────

const RESOURCE_ICON_MAP = {
  github: { logo: "github", color: "181717" },
  web: { logo: "googlechrome", color: "4285F4" },
  apple: { logo: "apple", color: "000000" },
  download: { logo: "download", color: "0969da" },
};

function resourceBadge(resource, style = "flat-square") {
  if (!resource.url) return "";
  const iconConfig = RESOURCE_ICON_MAP[resource.icon] || RESOURCE_ICON_MAP[resource.type] || { logo: "link", color: "555" };
  return linkedBadge(resource.label || resource.type || "Link", resource.url, {
    logo: iconConfig.logo,
    color: iconConfig.color,
    style,
  });
}

function resourceBadges(resources, style = "flat-square") {
  if (!resources || !resources.length) return "";
  return resources.map((r) => resourceBadge(r, style)).filter(Boolean).join(" ");
}

// ── GitHub Stats Cards ───────────────────────────────────────────────────────

const GITHUB_USERNAME = "ZSturman";

function githubStatsCard(options = {}) {
  const { theme = "default", hideTitle = false, hideBorder = true, showIcons = true } = options;
  const params = new URLSearchParams({
    username: GITHUB_USERNAME,
    show_icons: String(showIcons),
    theme,
    hide_title: String(hideTitle),
    hide_border: String(hideBorder),
  });
  return `![GitHub Stats](https://github-readme-stats.vercel.app/api?${params})`;
}

function streakCard(options = {}) {
  const { theme = "default", hideBorder = true } = options;
  const params = new URLSearchParams({
    user: GITHUB_USERNAME,
    theme,
    hide_border: String(hideBorder),
  });
  return `![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?${params})`;
}

function topLangsCard(options = {}) {
  const { theme = "default", layout = "compact", hideBorder = true, langs_count = "8" } = options;
  const params = new URLSearchParams({
    username: GITHUB_USERNAME,
    theme,
    layout,
    hide_border: String(hideBorder),
    langs_count,
  });
  return `![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?${params})`;
}

function repoCard(repoName, options = {}) {
  if (!repoName) return "";
  const { theme = "default", hideBorder = true } = options;
  const params = new URLSearchParams({
    username: GITHUB_USERNAME,
    repo: repoName,
    theme,
    hide_border: String(hideBorder),
  });
  const url = `https://github.com/${GITHUB_USERNAME}/${repoName}`;
  return `[![${repoName}](https://github-readme-stats.vercel.app/api/pin/?${params})](${url})`;
}

// ── Capsule Render ───────────────────────────────────────────────────────────

function capsuleImage(options = {}) {
  const {
    type = "waving",
    color = "0:667eea,100:764ba2",
    height = 200,
    section = "header",
    text = "",
    fontSize = 40,
    fontColor = "ffffff",
    animation = "",
    desc = "",
    descSize = 20,
    descAlignY = 75,
  } = options;
  const params = new URLSearchParams({
    type,
    color,
    height: String(height),
    section,
  });
  if (text) {
    params.set("text", text);
    params.set("fontSize", String(fontSize));
    params.set("fontColor", fontColor);
  }
  if (animation) params.set("animation", animation);
  if (desc) {
    params.set("desc", desc);
    params.set("descSize", String(descSize));
    params.set("descAlignY", String(descAlignY));
  }
  return `![header](https://capsule-render.vercel.app/api?${params})`;
}

// ── Typing SVG ───────────────────────────────────────────────────────────────

function typingSvg(lines, options = {}) {
  if (!lines || !lines.length) return "";
  const {
    color = "667eea",
    size = 22,
    center = true,
    vCenter = true,
    width = 500,
    duration = 3000,
    pause = 1000,
  } = options;
  const params = new URLSearchParams({
    lines: lines.join(";"),
    color,
    size: String(size),
    center: String(center),
    vCenter: String(vCenter),
    width: String(width),
    duration: String(duration),
    pause: String(pause),
  });
  return `![Typing SVG](https://readme-typing-svg.demolab.com?${params})`;
}

// ── Skill Icons ──────────────────────────────────────────────────────────────

function skillIconsImage(iconList, options = {}) {
  if (!iconList || !iconList.length) return "";
  const { perline = 8, theme = "light" } = options;
  const url = `https://skillicons.dev/icons?i=${iconList.join(",")}&perline=${perline}&theme=${theme}`;
  return `<img src="${url}" alt="Skills" />`;
}

// ── Mermaid diagrams ─────────────────────────────────────────────────────────

function mermaid(code) {
  if (!code) return "";
  return "```mermaid\n" + code + "\n```";
}

// ── Column / Grid layout ────────────────────────────────────────────────────

function columns(items, colCount = 2) {
  if (!items || !items.length) return "";
  const rows = [];
  for (let i = 0; i < items.length; i += colCount) {
    const cells = items.slice(i, i + colCount);
    while (cells.length < colCount) cells.push("");
    rows.push(cells);
  }

  const headerRow = rows[0].map(() => "").join(" | ");
  const alignRow = rows[0].map(() => "---").join(" | ");

  const lines = [`<table>`, `<tr>`];
  for (const row of rows) {
    lines.push("<tr>");
    for (const cell of row) {
      lines.push(`<td width="${Math.floor(100 / colCount)}%">\n\n${cell}\n\n</td>`);
    }
    lines.push("</tr>");
  }
  lines.push("</table>");
  return lines.join("\n");
}

// ── kbd tag ──────────────────────────────────────────────────────────────────

function kbdTag(text) {
  return `<kbd>${text}</kbd>`;
}

// ── Section dividers ─────────────────────────────────────────────────────────

function sectionDivider(style = "line") {
  switch (style) {
    case "wave":
      return `<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=60&section=footer" width="100%" />`;
    case "gradient":
      return `<img src="https://capsule-render.vercel.app/api?type=rect&color=0:667eea,100:764ba2&height=2&section=header" width="100%" />`;
    case "blank":
      return "\n<br>\n";
    case "thin":
      return `<img width="100%" src="https://capsule-render.vercel.app/api?type=transparent&height=1&color=auto" />`;
    default:
      return "---";
  }
}

// ── GitHub URL parser ────────────────────────────────────────────────────────

function parseGitHubRepo(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.replace(/^\//, "").replace(/\/$/, "").split("/");
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
  } catch {
    // not a valid URL
  }
  return null;
}

module.exports = {
  heading,
  bold,
  italic,
  inlineCode,
  blockquote,
  link,
  divider,
  badge,
  badgeUrl,
  progressBar,
  table,
  image,
  alignCenter,
  details,
  formatDate,
  formatDateShort,
  relativeTime,
  truncate,
  joinLines,
  blankLine,
  linkedBadge,
  resourceBadge,
  resourceBadges,
  githubStatsCard,
  streakCard,
  topLangsCard,
  repoCard,
  capsuleImage,
  typingSvg,
  skillIconsImage,
  mermaid,
  columns,
  kbdTag,
  sectionDivider,
  parseGitHubRepo,
};
