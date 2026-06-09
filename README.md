# Tidetime website

The marketing site and documentation for [Tidetime](https://github.com/Sulaiman-Dauda/tidetime),
built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build)
and deployed to GitHub Pages.

This repository is **separate from the application code** on purpose — the app
repo stays clean. The documentation pages are not written here; they are **synced
from the main repo's `/docs` folder** at build time, so updating the docs there
updates this site.

## How the docs sync works

```
main repo  ──►  /docs/*.md (authoritative, plain markdown)
                      │
                      │  scripts/sync-docs.mjs  (clone + transform)
                      ▼
this repo  ──►  src/content/docs/guides/*.md  (Starlight pages, generated)
                      │
                      ▼
              GitHub Pages
```

`scripts/sync-docs.mjs` resolves the docs source in this order:

1. `DOCS_SOURCE` — an absolute path to a `/docs` folder (explicit override).
2. `../tidetime/docs` — a sibling checkout of the main repo (local development).
3. A shallow `git clone` of the main repo (used in CI).

It adds Starlight frontmatter, rewrites `./FILE.md` cross-links to site routes,
and points root-level links (README, CONTRIBUTING, …) at GitHub. The generated
`src/content/docs/guides/` folder is git-ignored — it's a build artifact.

The landing page (`src/content/docs/index.mdx`) and the support page
(`src/content/docs/support.mdx`) are hand-written here and are never overwritten
by the sync.

## Local development

```bash
npm install
npm run dev      # runs the docs sync, then starts Astro at http://localhost:4321
```

If your Tidetime checkout isn't a sibling folder, point the sync at it:

```bash
DOCS_SOURCE=/absolute/path/to/tidetime/docs npm run dev
```

Build a production bundle locally:

```bash
npm run build && npm run preview
```

## Deploying to GitHub Pages

1. Push this folder to its own GitHub repository (e.g. `tidetime-website`).
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Push to `main`. The included workflow (`.github/workflows/deploy.yml`) syncs the
   docs, builds the site, and publishes it. `actions/configure-pages` injects the
   correct site URL and base path automatically, whether you use a custom domain
   or the default `https://<user>.github.io/<repo>/` project URL.

### Custom domain

When you have a domain:

1. Create `public/CNAME` containing just your domain, e.g. `tidetime.app`.
2. In **Settings → Pages → Custom domain**, enter the same domain and enable
   **Enforce HTTPS**.
3. At your DNS provider, point the domain at GitHub Pages:
   - apex domain → four `A` records to `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (and the `AAAA` equivalents), **or**
   - a subdomain (e.g. `www` / `docs`) → a `CNAME` record to `<user>.github.io`.

Prefer Cloudflare instead? Point Cloudflare DNS at the same GitHub Pages target
(proxied), or switch to Cloudflare Pages by connecting this repo and using
`npm run build` as the build command with `dist` as the output — the docs sync
runs the same way.

## Keeping docs in sync automatically

Every site build pulls the latest `/docs`, so any rebuild republishes fresh docs.
To rebuild **the moment docs change** in the main repo, add the companion
workflow to the **main** repository — it's included here for convenience at
[`main-repo-workflow/notify-website.yml`](./main-repo-workflow/notify-website.yml).

Copy it to `.github/workflows/notify-website.yml` in the main repo and add a
repository secret `WEBSITE_DISPATCH_TOKEN` (a fine-grained PAT with
`contents: write` / Actions access on this website repo). When `/docs` changes on
`main`, it fires a `repository_dispatch` that triggers this site's deploy.

Without that token, the site still updates on every push here and on manual
**Run workflow** from the Actions tab.

## Project structure

```
astro.config.mjs              Starlight config (nav, branding, sidebar)
scripts/sync-docs.mjs         pulls + transforms /docs from the main repo
src/content/docs/index.mdx    landing page (hand-written)
src/content/docs/support.mdx  support / donation page (hand-written)
src/content/docs/guides/      synced docs (generated; git-ignored)
src/styles/custom.css         ocean/tide theme
src/assets/                   logos
public/                       favicon, CNAME (when you add a domain)
```

## License

MIT, matching the main project.
