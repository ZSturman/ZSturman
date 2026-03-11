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
};
