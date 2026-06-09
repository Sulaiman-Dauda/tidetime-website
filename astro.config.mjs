// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Hosting URL + base path. For a custom domain (CNAME), keep base "/". For a
// GitHub project page without a domain (https://<user>.github.io/tidetime-website/),
// set BASE_PATH=/tidetime-website/ in the build environment.
const site = process.env.SITE_URL || "https://tidetime.app";
const base = process.env.BASE_PATH || "/";

// Root-absolute links inside markdown/MDX content (e.g. [API](/guides/api/))
// are NOT base-prefixed by Astro — only Starlight's own nav/hero are. Under a
// GitHub project-page base like /tidetime-website/, those links would resolve to
// the domain root and 404. This rehype plugin prefixes the base path to every
// internal root-absolute <a href>, in content, for both markdown and MDX.
const basePrefix = base.replace(/\/$/, ""); // "" for "/", "/tidetime-website" otherwise
function rehypeBaseLinks() {
  return (tree) => {
    const walk = (node) => {
      if (
        node.type === "element" &&
        node.tagName === "a" &&
        typeof node.properties?.href === "string"
      ) {
        const href = node.properties.href;
        // Internal, root-absolute, not already based, not protocol-relative.
        if (href.startsWith("/") && !href.startsWith("//") && basePrefix && !href.startsWith(basePrefix + "/")) {
          node.properties.href = basePrefix + href;
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  markdown: { rehypePlugins: [rehypeBaseLinks] },
  integrations: [
    starlight({
      title: "Tidetime",
      description:
        "The open-source, self-hosted scheduling platform — booking pages, team coordination, calendars, payments, and a developer API. One command to install.",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/Sulaiman-Dauda/tidetime" },
      ],
      // Per-page editUrl is injected by scripts/sync-docs.mjs so each guide links
      // to its real source file in the main repo's /docs (not the generated slug).
      lastUpdated: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Documentation overview", slug: "guides/readme" },
            { label: "Getting started", slug: "guides/getting-started" },
          ],
        },
        {
          label: "Using Tidetime",
          items: [
            { label: "User guide", slug: "guides/user-guide" },
            { label: "FAQ", slug: "guides/faq" },
            { label: "Glossary", slug: "guides/glossary" },
          ],
        },
        {
          label: "Administering",
          items: [
            { label: "Admin guide", slug: "guides/admin-guide" },
            { label: "Integrations", slug: "guides/integrations" },
            { label: "Troubleshooting", slug: "guides/troubleshooting" },
          ],
        },
        {
          label: "Self-hosting",
          items: [{ label: "Deployment", slug: "guides/deployment" }],
        },
        {
          label: "Building with Tidetime",
          items: [
            { label: "API reference", slug: "guides/api" },
            { label: "Architecture", slug: "guides/architecture" },
            { label: "Embed protocol", slug: "guides/embed-lifecycle" },
          ],
        },
        { label: "Support the project", link: "/support/" },
      ],
    }),
  ],
});
