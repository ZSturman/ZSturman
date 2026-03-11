# README Generation System

This repository uses a Notion-powered pipeline to generate the GitHub profile README. Instead of maintaining the README by hand, data from a connected Notion workspace is fetched and rendered into multiple styled variants automatically.

## How it works

1. **GitHub Actions** runs `scripts/generate-readme.js` on a 30-minute schedule (and on manual dispatch).
2. The script fetches data from up to 6 Notion databases (projects, work logs, personal links, milestones, tasks, automation logs).
3. Five distinct README variants are generated, each with a different design/storytelling approach.
4. All variants are written to the repo as `README.<variant-name>.md`.
5. The **primary variant** is also copied to `README.md`, which is what visitors see on the GitHub profile.
6. Execution start, success, and failure are logged to the Notion automation logs database.

## Variants

| File | Style | Concept |
| --- | --- | --- |
| `README.minimalist-retro.md` | Terminal Portfolio | Monospaced, text-forward, retro-terminal aesthetic. No images, no badges. Pure text hierarchy. |
| `README.editorial-clean.md` | Magazine Layout | Editorial, narrative, generous whitespace. Project cards with pull-quote styling. Images where available. |
| `README.technical-showcase.md` | Engineering Dashboard | Data-rich tables, shields.io badges, metrics. Feels like a status dashboard. |
| `README.quiet-premium.md` | Luxury Minimal | Maximum restraint. Top 3 projects only. Extreme negative space. Apple-style. |
| `README.systems-focused.md` | Connected Studio | Shows interconnection between projects, milestones, and work. Studio portfolio feel. |

## Switching the primary variant

Set the `PRIMARY_VARIANT` repository variable (not secret) in GitHub to one of:

- `minimalist-retro`
- `editorial-clean` (default)
- `technical-showcase`
- `quiet-premium`
- `systems-focused`

Or set it as an environment variable when running locally:

```bash
PRIMARY_VARIANT=quiet-premium npm run generate-readme
```

## Required secrets

| Secret | Required | Purpose |
| --- | --- | --- |
| `NOTION_TOKEN` | **Yes** | Notion API integration token |
| `NOTION_PROJECTS_DB_ID` | **Yes** | Projects database — core data source |
| `NOTION_WORK_LOG_DB_ID` | No | Work Log database — recent sessions, activity |
| `NOTION_PERSONAL_LINKS_DB_ID` | No | Personal Links database — profile links |
| `NOTION_MILESTONES_DB_ID` | No | Milestones database — active goals + progress |
| `NOTION_TASKS_DB_ID` | No | Tasks database — recent completions |
| `NOTION_AUTOMATION_LOGS_DB_ID` | No | Automation Logs database — execution logging |

Optional database IDs can be added incrementally. If a database ID is missing, the corresponding data is simply omitted from generated variants — no errors.

## Running locally

```bash
cd ZSturman

# Set required env vars
export NOTION_TOKEN="your-notion-token"
export NOTION_PROJECTS_DB_ID="your-projects-db-id"

# Set optional env vars for richer output
export NOTION_WORK_LOG_DB_ID="your-work-log-db-id"
export NOTION_PERSONAL_LINKS_DB_ID="your-links-db-id"
export NOTION_MILESTONES_DB_ID="your-milestones-db-id"
export NOTION_TASKS_DB_ID="your-tasks-db-id"
export NOTION_AUTOMATION_LOGS_DB_ID="your-automation-logs-db-id"

npm ci
npm run generate-readme
```

Output files will be written to the repo root:

- `README.md` (primary variant)
- `README.minimalist-retro.md`
- `README.editorial-clean.md`
- `README.technical-showcase.md`
- `README.quiet-premium.md`
- `README.systems-focused.md`

## Adding a new variant

1. Create a new file in `scripts/variants/` (e.g., `my-new-style.js`).
2. Export a `generate(data)` function that returns a markdown string.
3. The `data` object contains: `{ projects, workLogs, links, milestones, tasks, stats }`.
4. Register the variant in `scripts/generate-readme.js` by adding it to the `VARIANTS` object.
5. The new variant will automatically be generated on the next run.

The `data` shape:

```text
projects[]     — { title, oneLiner, summary, subtitle, status, phase, tags[], category[],
                   mediums[], repoLink, thumbnailPreview, heroPreview, bannerPreview,
                   iconPreview, posterPreview, downloadUrl, lastUpdateAt, startedAt }

workLogs[]     — { date, entry, whatHappened, projectName, sessionType, duration,
                   nextStep, problems }

links[]        — { label, url, email }

milestones[]   — { milestone, description, projectName, totalTasks, completedTasks,
                   taskPercentComplete, status, effectiveDoDate, effectiveDueDate, isBlocked }

tasks[]        — { task, projectName, dateCompleted, type, priority }

stats          — { totalProjects, totalSessions, totalMinutes, avgSessionMinutes,
                   activeMilestones, recentTaskCount, sessionsLast30Days, hoursLast30Days }
```

## Image handling

Notion-hosted image URLs (S3 signed URLs) expire after approximately 1 hour. The system checks each image URL for stability:

- **Stable URLs** (CDN, GitHub raw, custom domains) → used in variants that include images
- **Notion S3 URLs** → skipped, variant falls back to text-only presentation

To get reliable images in your README, host project images on a stable CDN and put those URLs in the Notion `preview` or `url` fields on your asset records.

## Automation logging

When `NOTION_AUTOMATION_LOGS_DB_ID` is configured, the script writes to your Notion automation logs database:

- **On start:** Creates a log entry with status "Running", workflow name, trigger source, and execution ID
- **On success:** Updates the entry to "Success" with a summary of what was generated
- **On failure:** Updates the entry to "Failed" with the error message and failed node

This integrates with the existing automation logging structure in your Notion workspace.

## File structure

```text
scripts/
├── generate-readme.js          # Orchestrator — the main entry point
├── lib/
│   ├── notion.js               # Notion client + all data fetchers
│   ├── renderer.js             # Shared markdown rendering helpers
│   ├── automation-log.js       # Notion automation log writer
│   └── github-compat.js        # GitHub README rendering compatibility
└── variants/
    ├── minimalist-retro.js     # Terminal Portfolio
    ├── editorial-clean.js      # Magazine Layout
    ├── technical-showcase.js   # Engineering Dashboard
    ├── quiet-premium.js        # Luxury Minimal
    └── systems-focused.js      # Connected Studio
```
