// GitHub profile README compatibility layer.
// Documents what renders reliably and provides safety utilities.

// Notion S3 signed URLs expire after ~1 hour. These are unreliable for README
// images that must persist between workflow runs.
const NOTION_S3_PATTERNS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com/secure.notion-static.com",
  "secure.notion-static.com",
];

/**
 * Returns true if the URL is likely to remain accessible long-term.
 * Returns false for Notion-hosted S3 signed URLs and null/undefined.
 */
function isStableImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return !NOTION_S3_PATTERNS.some(
      (pattern) =>
        parsed.hostname.includes(pattern) || parsed.href.includes(pattern)
    );
  } catch {
    return false;
  }
}

// HTML tags that GitHub profile READMEs actually render
const SUPPORTED_TAGS = new Set([
  "div",
  "img",
  "a",
  "details",
  "summary",
  "picture",
  "source",
  "br",
  "hr",
  "sub",
  "sup",
  "kbd",
  "samp",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "p",
  "em",
  "strong",
  "del",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
]);

// Attributes GitHub allows on HTML tags
const SUPPORTED_ATTRS = new Set([
  "align",
  "width",
  "height",
  "src",
  "alt",
  "href",
  "media",
  "open",
  "colspan",
  "rowspan",
]);

module.exports = {
  isStableImageUrl,
  SUPPORTED_TAGS,
  SUPPORTED_ATTRS,
  NOTION_S3_PATTERNS,
};
