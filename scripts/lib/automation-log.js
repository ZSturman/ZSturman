// Automation log writer for the Notion automation logs database.
// Creates a single log entry per workflow run and updates it on completion/failure.

const { getClient } = require("./notion");

const DB_ID_KEY = "NOTION_AUTOMATION_LOGS_DB_ID";
const WORKFLOW_NAME = "GitHub Profile README Generation";

function getDbId() {
  return process.env[DB_ID_KEY] || null;
}

/**
 * Create a "Running" log entry at workflow start.
 * Returns the page ID for subsequent updates, or null if logging is unavailable.
 */
async function logStart({ trigger = "schedule", executionId = "" } = {}) {
  const dbId = getDbId();
  if (!dbId) {
    console.log("Automation logging skipped — no NOTION_AUTOMATION_LOGS_DB_ID");
    return null;
  }

  try {
    const notion = getClient();
    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        name: { title: [{ text: { content: WORKFLOW_NAME } }] },
        status: { status: { name: "Running" } },
        timestamp: { date: { start: new Date().toISOString() } },
        workflow: { rich_text: [{ text: { content: "update-profile" } }] },
        "source trigger": {
          rich_text: [{ text: { content: trigger } }],
        },
        ...(executionId && {
          "execution id": {
            rich_text: [{ text: { content: executionId } }],
          },
        }),
      },
    });
    return page.id;
  } catch (err) {
    console.warn("Failed to create automation log entry:", err.message);
    return null;
  }
}

/**
 * Update the log entry to "Success" with summary details.
 */
async function logSuccess(
  pageId,
  { details = "", projectsCount = 0, workLogsCount = 0 } = {}
) {
  if (!pageId) return;

  try {
    const notion = getClient();
    await notion.pages.update({
      page_id: pageId,
      properties: {
        status: { status: { name: "Success" } },
        details: {
          rich_text: [
            {
              text: {
                content: truncateText(details, 1900),
              },
            },
          ],
        },
        "projects count": { number: projectsCount },
        "work logs count": { number: workLogsCount },
      },
    });
  } catch (err) {
    console.warn("Failed to update automation log (success):", err.message);
  }
}

/**
 * Update the log entry to "Failed" with error details.
 */
async function logFailure(pageId, { error = "", failedNode = "" } = {}) {
  if (!pageId) return;

  try {
    const notion = getClient();
    await notion.pages.update({
      page_id: pageId,
      properties: {
        status: { status: { name: "Failed" } },
        details: {
          rich_text: [
            {
              text: {
                content: truncateText(`Error: ${error}`, 1900),
              },
            },
          ],
        },
        ...(failedNode && {
          "failed node": {
            rich_text: [{ text: { content: failedNode } }],
          },
        }),
      },
    });
  } catch (err) {
    console.warn("Failed to update automation log (failure):", err.message);
  }
}

function truncateText(text, max) {
  if (!text || text.length <= max) return text || "";
  return text.slice(0, max - 1) + "…";
}

module.exports = { logStart, logSuccess, logFailure };
