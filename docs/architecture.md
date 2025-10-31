Project architecture

Top-level
- index.html and other *.html: static pages that the client script hydrates with Contentstack content.
- assets/: client code and static assets.
- content_types/: Contentstack content type schemas (JSON).
- entries/: Seed entries for each content type (JSON).
- scripts/: Node scripts to import, publish, verify, and link content.
- server.js: Express static server used for local development.

Runtime data flow
1) Import: scripts/import-all.js upserts global fields, content types, entries, and publishes them (if CS_ENVIRONMENT is set).
2) Publish assets: scripts/publish-linked-assets.js publishes any assets referenced in entries.
3) Delivery: assets/contentstack-sync.js fetches published entries from the Delivery API and renders them on each page.

Key scripts
- npm run dev: start the local server at http://localhost:3000
- npm run import:all: upsert global fields, content types, entries (reads env vars)
- npm run publish:assets: publish assets referenced by entries to the environment
- npm run link:docs: map doc_page entries to official Contentstack doc URLs and publish
- npm run verify:delivery: check Delivery API counts per content type

Environment
Provide required environment variables (see .env.example). On Windows PowerShell, you can prefix commands with set VAR=value && ... as in README.

Notes
- Asset uploads: If Contentstack returns 500 for asset uploads, add images via the UI and ensure they are published to the target environment.
- Cache busting: contentstack-sync appends ?v=<timestamp> to image URLs to avoid stale caching.

