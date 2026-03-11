const fs = require("fs");
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATA_SOURCE_ID = process.env.NOTION_PROJECTS_DB_ID;
const README_PATH = "README.md";

function richTextToPlain(richTextArray) {
  if (!Array.isArray(richTextArray)) return "";
  return richTextArray.map((item) => item.plain_text || "").join("");
}

function getTitle(page, propertyName = "title") {
  const prop = page.properties[propertyName];
  if (!prop || prop.type !== "title") return "Untitled";
  return richTextToPlain(prop.title) || "Untitled";
}

function getRichText(page, propertyName) {
  const prop = page.properties[propertyName];
  if (!prop || prop.type !== "rich_text") return "";
  return richTextToPlain(prop.rich_text);
}

function getUrl(page, propertyName) {
  const prop = page.properties[propertyName];
  if (!prop || prop.type !== "url") return "";
  return prop.url || "";
}

function getCheckbox(page, propertyName) {
  const prop = page.properties[propertyName];
  if (!prop || prop.type !== "checkbox") return false;
  return !!prop.checkbox;
}

function getNumber(page, propertyName) {
  const prop = page.properties[propertyName];
  if (!prop || prop.type !== "number") return null;
  return prop.number;
}

async function fetchProjects() {
  let results = [];
  let cursor = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      start_cursor: cursor,
      sorts: [
        {
          property: "featured order",
          direction: "ascending",
        },
      ],
      filter: {
        and: [
          {
            property: "featured",
            checkbox: { equals: true },
          },
        ],
      },
    });

    results = results.concat(response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

function renderMarkdown(pages) {
  if (!pages.length) {
    return "_No featured projects right now._";
  }

  return pages
    .map((page) => {
      const name = getTitle(page, "title");
      const summary = getRichText(page, "one liner");
      const link = getUrl(page, "repo link");

      if (link) {
        return `- **[${name}](${link})** — ${summary}`;
      }
      return `- **${name}** — ${summary}`;
    })
    .join("\n");
}

function replaceSection(readme, startMarker, endMarker, newContent) {
  const pattern = new RegExp(
    `${startMarker}[\\s\\S]*?${endMarker}`,
    "m"
  );
  return readme.replace(
    pattern,
    `${startMarker}\n${newContent}\n${endMarker}`
  );
}

async function main() {
  const pages = await fetchProjects();
  const markdown = renderMarkdown(pages);

  const readme = fs.readFileSync(README_PATH, "utf8");
  const updated = replaceSection(
    readme,
    "<!-- notion-projects:start -->",
    "<!-- notion-projects:end -->",
    markdown
  );

  if (updated !== readme) {
    fs.writeFileSync(README_PATH, updated);
    console.log("README updated.");
  } else {
    console.log("No README changes needed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
