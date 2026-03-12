// Skills derivation and rendering.
// Maps project tags to visual badges and icon sets for README rendering.

// ── Curated skills config ────────────────────────────────────────────────────
// Each entry: { label, logo (simple-icons slug), color, category }

const SKILLS_CONFIG = {
  // Languages
  Swift:           { label: "Swift",       logo: "swift",       color: "F05138", category: "Languages" },
  Python:          { label: "Python",      logo: "python",      color: "3776AB", category: "Languages" },
  TS:              { label: "TypeScript",  logo: "typescript",  color: "3178C6", category: "Languages" },
  TypeScript:      { label: "TypeScript",  logo: "typescript",  color: "3178C6", category: "Languages" },
  JavaScript:      { label: "JavaScript",  logo: "javascript",  color: "F7DF1E", category: "Languages" },
  SQL:             { label: "SQL",         logo: "postgresql",  color: "4169E1", category: "Languages" },

  // Frameworks & Libraries
  React:           { label: "React",       logo: "react",       color: "61DAFB", category: "Frameworks" },
  "Next.js":       { label: "Next.js",     logo: "nextdotjs",   color: "000000", category: "Frameworks" },
  Flask:           { label: "Flask",       logo: "flask",       color: "000000", category: "Frameworks" },
  SwiftUI:         { label: "SwiftUI",     logo: "swift",       color: "F05138", category: "Frameworks" },
  CoreML:          { label: "Core ML",     logo: "apple",       color: "000000", category: "Frameworks" },

  // Platforms
  iOS:             { label: "iOS",         logo: "apple",       color: "000000", category: "Platforms" },
  macOS:           { label: "macOS",       logo: "apple",       color: "000000", category: "Platforms" },
  Web:             { label: "Web",         logo: "googlechrome",color: "4285F4", category: "Platforms" },

  // Tools & Infrastructure
  Git:             { label: "Git",         logo: "git",         color: "F05032", category: "Tools" },
  Notion:          { label: "Notion",      logo: "notion",      color: "000000", category: "Tools" },
  n8n:             { label: "n8n",         logo: "n8n",         color: "EA4B71", category: "Tools" },
  Xcode:           { label: "Xcode",       logo: "xcode",       color: "147EFB", category: "Tools" },
  Figma:           { label: "Figma",       logo: "figma",       color: "F24E1E", category: "Tools" },
  Docker:          { label: "Docker",      logo: "docker",      color: "2496ED", category: "Tools" },

  // Domains
  "Machine Learning": { label: "Machine Learning", logo: "pytorch",  color: "EE4C2C", category: "Domains" },
  "Data Analytics":   { label: "Data Analytics",   logo: "pandas",   color: "150458", category: "Domains" },
  "Spaced Repetition":{ label: "Spaced Repetition",logo: "lightning", color: "792EE5", category: "Domains" },
  Productivity:       { label: "Productivity",     logo: "todoist",   color: "E44332", category: "Domains" },
  Health:             { label: "Health",           logo: "apple",     color: "FF2D55", category: "Domains" },
  Widgets:            { label: "Widgets",          logo: "apple",     color: "147EFB", category: "Platforms" },
};

// Mapping from tag names to skillicons.dev icon IDs
const SKILLICONS_MAP = {
  Swift: "swift",
  Python: "py",
  TS: "ts",
  TypeScript: "ts",
  JavaScript: "js",
  React: "react",
  "Next.js": "nextjs",
  Flask: "flask",
  Git: "git",
  Docker: "docker",
  Figma: "figma",
  iOS: "apple",
  macOS: "apple",
  Notion: "notion",
  SQL: "postgres",
  "Machine Learning": "pytorch",
};

/**
 * Derive skills from project tags, returning matched skills grouped by category.
 * @param {Array} projects — array of project objects with `tags` arrays
 * @returns {{ byCategory: Map<string, Array>, all: Array }}
 */
function deriveSkills(projects) {
  const tagSet = new Set();
  for (const p of projects) {
    for (const t of p.tags || []) tagSet.add(t);
  }

  const matched = [];
  for (const tag of tagSet) {
    const config = SKILLS_CONFIG[tag];
    if (config) matched.push({ tag, ...config });
  }

  // Sort: Languages first, then Frameworks, Platforms, Tools, Domains
  const categoryOrder = ["Languages", "Frameworks", "Platforms", "Tools", "Domains"];
  matched.sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );

  const byCategory = new Map();
  for (const s of matched) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category).push(s);
  }

  return { all: matched, byCategory };
}

/**
 * Render skills as shields.io badges.
 * @param {Array} skills — from deriveSkills().all
 * @param {string} style — shields.io style: flat, flat-square, for-the-badge, plastic
 * @returns {string} markdown string of badge images
 */
function renderSkillBadges(skills, style = "flat-square") {
  return skills
    .map((s) => {
      const label = encodeURIComponent(s.label.replace(/-/g, "--"));
      return `![${s.label}](https://img.shields.io/badge/${label}-${s.color}?style=${style}&logo=${s.logo}&logoColor=white)`;
    })
    .join(" ");
}

/**
 * Generate a skillicons.dev URL for a visual icon grid.
 * @param {Array} skills — from deriveSkills().all
 * @param {{ perline?: number, theme?: string }} options
 * @returns {string|null} URL string, or null if no icons matched
 */
function renderSkillIconsUrl(skills, options = {}) {
  const { perline = 8, theme = "light" } = options;
  const icons = [];
  const seen = new Set();
  for (const s of skills) {
    const iconId = SKILLICONS_MAP[s.tag];
    if (iconId && !seen.has(iconId)) {
      seen.add(iconId);
      icons.push(iconId);
    }
  }
  if (!icons.length) return null;
  return `https://skillicons.dev/icons?i=${icons.join(",")}&perline=${perline}&theme=${theme}`;
}

module.exports = {
  SKILLS_CONFIG,
  deriveSkills,
  renderSkillBadges,
  renderSkillIconsUrl,
};
