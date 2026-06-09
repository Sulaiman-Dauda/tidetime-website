// ─────────────────────────────────────────────────────────────────────────────
//  Docs sync: pull Tidetime's authoritative /docs markdown and convert it into
//  Starlight content pages under src/content/docs/guides/.
//
//  Source resolution order:
//    1. DOCS_SOURCE env var (absolute path to a /docs folder)        — explicit
//    2. ../tidetime/docs (sibling checkout)                          — local dev
//    3. git clone of the main repo into a temp dir                   — CI
//
//  The main repo's docs stay plain GitHub-flavored markdown (so they also render
//  on GitHub). This script adds the Starlight frontmatter, rewrites cross-links
//  to site routes, and points root-level links (README, CONTRIBUTING, …) at
//  GitHub. Landing (index.mdx) and support (support.mdx) pages are NOT touched.
// ─────────────────────────────────────────────────────────────────────────────
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "src", "content", "docs", "guides");
const REPO = process.env.DOCS_REPO || "https://github.com/Sulaiman-Dauda/tidetime.git";
const BRANCH = process.env.DOCS_BRANCH || "main";
const REPO_WEB = process.env.DOCS_REPO_WEB || "https://github.com/Sulaiman-Dauda/tidetime";
const GITHUB_BLOB = `${REPO_WEB}/blob/${BRANCH}`;
const GITHUB_EDIT = `${REPO_WEB}/edit/${BRANCH}`;

// Ordering + sidebar grouping. Files not listed are appended alphabetically.
const ORDER = [
  "README", "GETTING_STARTED", "USER_GUIDE", "FAQ", "GLOSSARY",
  "ADMIN_GUIDE", "INTEGRATIONS", "TROUBLESHOOTING",
  "DEPLOYMENT", "API", "ARCHITECTURE", "EMBED_LIFECYCLE",
];

// Pretty titles for the docs index page (overrides the H1 when set).
const TITLE_OVERRIDES = { README: "Documentation overview" };

const slug = (name) => name.toLowerCase().replace(/_/g, "-");

function resolveSource() {
  if (process.env.DOCS_SOURCE && existsSync(process.env.DOCS_SOURCE)) {
    return { dir: process.env.DOCS_SOURCE, cleanup: null };
  }
  const sibling = resolve(ROOT, "..", "tidetime", "docs");
  if (existsSync(sibling)) return { dir: sibling, cleanup: null };

  const tmp = join(tmpdir(), `tidetime-docs-${Date.now()}`);
  console.log(`• Cloning ${REPO} (${BRANCH}) to read /docs …`);
  execSync(
    `git clone --depth 1 --branch ${BRANCH} --filter=blob:none --sparse ${REPO} ${tmp}`,
    { stdio: "inherit" },
  );
  execSync(`git -C ${tmp} sparse-checkout set docs`, { stdio: "inherit" });
  return { dir: join(tmp, "docs"), cleanup: tmp };
}

function deriveDescription(body) {
  const lines = body.split("\n");
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#") || line.startsWith(">") || line.startsWith("|") || line.startsWith("-") || line.startsWith("```")) continue;
    const text = line
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 0) return text.length > 158 ? text.slice(0, 155).trimEnd() + "…" : text;
  }
  return "Tidetime documentation.";
}

function rewriteLinks(body) {
  // ./FILE.md(#anchor)  → /guides/file/(#anchor)
  body = body.replace(/\]\(\.\/([A-Za-z0-9_-]+)\.md(#[^)]+)?\)/g, (_m, name, anchor) =>
    `](/guides/${slug(name)}/${anchor ? anchor : ""})`,
  );
  // releases/x.md → keep on GitHub (not synced as guides)
  body = body.replace(/\]\(\.\/releases\/([^)]+)\)/g, `](${GITHUB_BLOB}/docs/releases/$1)`);
  // ../anything (repo-root-relative paths: README.md, src/.../File.tsx, …) → GitHub blob
  body = body.replace(/\]\(\.\.\/([^)#]+)(#[^)]+)?\)/g, (_m, path, anchor) =>
    `](${GITHUB_BLOB}/${path}${anchor || ""})`,
  );
  return body;
}

function yamlEscape(s) {
  return `"${s.replace(/"/g, '\\"')}"`;
}

function build() {
  const { dir, cleanup } = resolveSource();
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  let count = 0;

  for (const file of files) {
    const name = file.replace(/\.md$/, "");
    const raw = readFileSync(join(dir, file), "utf8");

    // Title from first H1; strip that H1 from the body.
    const h1 = raw.match(/^#\s+(.+)$/m);
    const title = TITLE_OVERRIDES[name] || (h1 ? h1[1].trim() : name);
    let body = h1 ? raw.replace(h1[0], "").replace(/^\s+/, "") : raw;

    const description = deriveDescription(body);
    body = rewriteLinks(body);

    const orderIdx = ORDER.indexOf(name);
    const sidebarOrder = orderIdx === -1 ? 100 + count : orderIdx;

    const frontmatter = [
      "---",
      `title: ${yamlEscape(title)}`,
      `description: ${yamlEscape(description)}`,
      // Point "Edit page" at the real source file in the main repo (not the
      // generated slug), so contributors land on the right markdown.
      `editUrl: ${yamlEscape(`${GITHUB_EDIT}/docs/${file}`)}`,
      `sidebar:`,
      `  order: ${sidebarOrder}`,
      "---",
      "",
    ].join("\n");

    writeFileSync(join(OUT_DIR, `${slug(name)}.md`), frontmatter + body, "utf8");
    count++;
  }

  if (cleanup) rmSync(cleanup, { recursive: true, force: true });
  console.log(`✓ Synced ${count} doc pages into src/content/docs/guides/`);
}

build();
