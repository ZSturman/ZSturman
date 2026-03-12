// Notion data-fetching layer
// Provides normalized data from all relevant Notion databases.
// Each fetcher gracefully returns [] if its DB ID env var is missing.

const { Client } = require("@notionhq/client");

let _client;
function getClient() {
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return _client;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function richTextToPlain(richTextArray) {
  if (!Array.isArray(richTextArray)) return "";
  return richTextArray.map((item) => item.plain_text || "").join("");
}

function getProp(page, name) {
  return page.properties?.[name];
}

function extractTitle(page, name = "title") {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "title") return "";
  return richTextToPlain(prop.title) || "";
}

function extractRichText(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "rich_text") return "";
  return richTextToPlain(prop.rich_text);
}

function extractUrl(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "url") return "";
  return prop.url || "";
}

function extractCheckbox(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "checkbox") return false;
  return prop.checkbox;
}

function extractNumber(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "number") return null;
  return prop.number;
}

function extractDate(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "date" || !prop.date) return null;
  return prop.date.start || null;
}

function extractSelect(page, name) {
  const prop = getProp(page, name);
  if (!prop) return "";
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "status") return prop.status?.name || "";
  return "";
}

function extractMultiSelect(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "multi_select") return [];
  return (prop.multi_select || []).map((s) => s.name);
}

function extractFormulaValue(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "formula") return null;
  const f = prop.formula;
  if (f.type === "string") return f.string;
  if (f.type === "number") return f.number;
  if (f.type === "boolean") return f.boolean;
  if (f.type === "date") return f.date?.start || null;
  return null;
}

function extractRollupValue(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "rollup") return null;
  const r = prop.rollup;
  if (r.type === "number") return r.number;
  if (r.type === "array" && r.array?.length) {
    return r.array.map((item) => {
      if (item.type === "title") return richTextToPlain(item.title);
      if (item.type === "rich_text") return richTextToPlain(item.rich_text);
      if (item.type === "number") return item.number;
      return null;
    });
  }
  return null;
}

function extractRelationTitles(page, name) {
  // Relations only give IDs in the query response; we can't resolve titles
  // without additional API calls. Return IDs for now.
  const prop = getProp(page, name);
  if (!prop || prop.type !== "relation") return [];
  return (prop.relation || []).map((r) => r.id);
}

function extractEmail(page, name) {
  const prop = getProp(page, name);
  if (!prop || prop.type !== "email") return "";
  return prop.email || "";
}

// ── Paginated query ──────────────────────────────────────────────────────────

async function queryAll(databaseId, options = {}) {
  const notion = getClient();
  let results = [];
  let cursor;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      ...options,
    });
    results = results.concat(response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchFeaturedProjects() {
  const dbId = process.env.NOTION_PROJECTS_DB_ID;
  if (!dbId) return [];

  const pages = await queryAll(dbId, {
    sorts: [{ property: "featured order", direction: "ascending" }],
    filter: { property: "featured", checkbox: { equals: true } },
  });

  return pages.map((page) => ({
    id: page.id,
    title: extractTitle(page, "title"),
    oneLiner: extractRichText(page, "one liner"),
    summary: extractRichText(page, "summary"),
    subtitle: extractRichText(page, "subtitle"),
    status: extractSelect(page, "status"),
    phase: extractSelect(page, "phase"),
    tags: extractMultiSelect(page, "tags"),
    category: extractMultiSelect(page, "category"),
    mediums: extractMultiSelect(page, "mediums"),
    repoLink: extractUrl(page, "repo link"),
    thumbnailPreview: extractFormulaValue(page, "thumbnail preview"),
    heroPreview: extractFormulaValue(page, "hero preview"),
    bannerPreview: extractFormulaValue(page, "banner preview"),
    iconPreview: extractFormulaValue(page, "icon preview"),
    posterPreview: extractFormulaValue(page, "poster preview"),
    downloadUrl: extractUrl(page, "download url"),
    lastUpdateAt: extractDate(page, "last update at"),
    startedAt: extractDate(page, "started at"),
    featuredOrder: extractNumber(page, "featured order"),
  }));
}

async function fetchRecentWorkLogs(limit = 10) {
  const dbId = process.env.NOTION_WORK_LOG_DB_ID;
  if (!dbId) return [];

  const pages = await queryAll(dbId, {
    sorts: [{ property: "date", direction: "descending" }],
    filter: { property: "public", checkbox: { equals: true } },
    page_size: limit,
  });

  // Resolve project names from relation IDs
  const logs = pages.slice(0, limit).map((page) => ({
    id: page.id,
    date: extractDate(page, "date"),
    entry: extractTitle(page, "entry"),
    whatHappened: extractRichText(page, "What Happened"),
    projectIds: extractRelationTitles(page, "project"),
    sessionType: extractSelect(page, "Session type"),
    duration: extractFormulaValue(page, "duration (min)"),
    nextStep: extractRichText(page, "Next Step"),
    problems: extractRichText(page, "Problems"),
    sessionStart: extractDate(page, "session start"),
    sessionEnd: extractDate(page, "session end"),
  }));

  // Batch-resolve project names for work logs
  const allProjectIds = [...new Set(logs.flatMap((l) => l.projectIds))];
  const projectNameMap = await resolvePageTitles(allProjectIds);

  return logs.map((log) => ({
    ...log,
    projectName: log.projectIds
      .map((id) => projectNameMap[id] || "")
      .filter(Boolean)
      .join(", "),
  }));
}

async function fetchPersonalLinks() {
  const dbId = process.env.NOTION_PERSONAL_LINKS_DB_ID;
  if (!dbId) return [];

  const pages = await queryAll(dbId);

  return pages.map((page) => ({
    id: page.id,
    label: extractTitle(page, "label"),
    url: extractUrl(page, "url"),
    email: extractEmail(page, "email"),
  }));
}

async function fetchActiveMilestones() {
  const dbId = process.env.NOTION_MILESTONES_DB_ID;
  if (!dbId) return [];

  const pages = await queryAll(dbId, {
    filter: { property: "is active", formula: { checkbox: { equals: true } } },
  });

  const milestones = pages.map((page) => ({
    id: page.id,
    milestone: extractTitle(page, "milestone"),
    description: extractRichText(page, "description"),
    projectIds: extractRelationTitles(page, "project"),
    totalTasks: extractRollupValue(page, "total tasks"),
    completedTasks: extractRollupValue(page, "completed tasks"),
    taskPercentComplete: extractRollupValue(page, "task % complete"),
    status: extractFormulaValue(page, "status"),
    effectiveDoDate: extractFormulaValue(page, "effective do date"),
    effectiveDueDate: extractFormulaValue(page, "effective due date"),
    isBlocked: extractFormulaValue(page, "is blocked"),
  }));

  // Resolve project names
  const allProjectIds = [...new Set(milestones.flatMap((m) => m.projectIds))];
  const projectNameMap = await resolvePageTitles(allProjectIds);

  return milestones.map((m) => ({
    ...m,
    projectName: m.projectIds
      .map((id) => projectNameMap[id] || "")
      .filter(Boolean)
      .join(", "),
  }));
}

async function fetchRecentCompletedTasks(limit = 15) {
  const dbId = process.env.NOTION_TASKS_DB_ID;
  if (!dbId) return [];

  const pages = await queryAll(dbId, {
    sorts: [{ property: "date completed", direction: "descending" }],
    filter: {
      and: [
        { property: "complete", checkbox: { equals: true } },
        { property: "public", checkbox: { equals: true } },
      ],
    },
    page_size: limit,
  });

  const tasks = pages.slice(0, limit).map((page) => ({
    id: page.id,
    task: extractTitle(page, "task"),
    projectIds: extractRelationTitles(page, "project"),
    dateCompleted: extractDate(page, "date completed"),
    type: extractSelect(page, "type"),
    priority: extractSelect(page, "priority"),
  }));

  const allProjectIds = [...new Set(tasks.flatMap((t) => t.projectIds))];
  const projectNameMap = await resolvePageTitles(allProjectIds);

  return tasks.map((t) => ({
    ...t,
    projectName: t.projectIds
      .map((id) => projectNameMap[id] || "")
      .filter(Boolean)
      .join(", "),
  }));
}

// ── Resources fetcher ────────────────────────────────────────────────────────

async function fetchResources() {
  const dbId = process.env.NOTION_RESOURCES_DB_ID;
  if (!dbId) return [];

  const pages = await queryAll(dbId, {
    filter: { property: "public", checkbox: { equals: true } },
  });

  const resources = pages.map((page) => ({
    id: page.id,
    resourceId: extractTitle(page, "id"),
    label: extractRichText(page, "label"),
    type: extractSelect(page, "type"),
    url: extractUrl(page, "url"),
    icon: extractSelect(page, "icon"),
    projectIds: extractRelationTitles(page, "projects"),
  }));

  return resources;
}

// ── Relation title resolver ──────────────────────────────────────────────────

async function resolvePageTitles(pageIds) {
  if (!pageIds.length) return {};
  const notion = getClient();
  const map = {};

  // Batch resolve — Notion API only supports one page at a time
  await Promise.allSettled(
    pageIds.map(async (id) => {
      try {
        const page = await notion.pages.retrieve({ page_id: id });
        // Find the title property
        for (const [, prop] of Object.entries(page.properties)) {
          if (prop.type === "title") {
            map[id] = richTextToPlain(prop.title);
            break;
          }
        }
      } catch {
        // Silently skip unresolvable pages
      }
    })
  );

  return map;
}

// ── Aggregate stats ──────────────────────────────────────────────────────────

function computeStats(data) {
  const { projects, workLogs, milestones, tasks } = data;

  const totalProjects = projects.length;
  const totalSessions = workLogs.length;
  const totalMinutes = workLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
  const avgSessionMinutes =
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

  const activeMilestones = milestones.length;
  const recentTaskCount = tasks.length;

  // Streaks / recency
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = workLogs.filter(
    (l) => l.date && new Date(l.date) >= thirtyDaysAgo
  );
  const sessionsLast30Days = recentSessions.length;
  const hoursLast30Days = Math.round(
    recentSessions.reduce((sum, l) => sum + (l.duration || 0), 0) / 60
  );

  // Unique tags across all projects (for skills derivation)
  const uniqueTags = [...new Set(projects.flatMap((p) => p.tags || []))];
  const uniqueCategories = [...new Set(projects.flatMap((p) => p.category || []))];
  const totalHoursLogged = Math.round(totalMinutes / 60);

  const activeProjects = projects.filter(
    (p) => p.status && p.status.toLowerCase().includes("active")
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status && p.status.toLowerCase().includes("complete")
  ).length;

  return {
    totalProjects,
    totalSessions,
    totalMinutes,
    avgSessionMinutes,
    activeMilestones,
    recentTaskCount,
    sessionsLast30Days,
    hoursLast30Days,
    uniqueTags,
    uniqueCategories,
    totalHoursLogged,
    activeProjects,
    completedProjects,
  };
}

module.exports = {
  getClient,
  fetchFeaturedProjects,
  fetchRecentWorkLogs,
  fetchPersonalLinks,
  fetchActiveMilestones,
  fetchRecentCompletedTasks,
  fetchResources,
  computeStats,
};
