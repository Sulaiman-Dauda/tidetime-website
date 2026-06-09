// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Hosting URL + base path. For a custom domain (CNAME), keep base "/". For a
// GitHub project page without a domain (https://<user>.github.io/tidetime-website/),
// set BASE_PATH=/tidetime-website/ in the build environment.
const site = process.env.SITE_URL || "https://tidetime.app";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
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
