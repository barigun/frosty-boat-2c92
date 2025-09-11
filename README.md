# Astro Starter Kit: Blog

![Astro Template Preview](https://github.com/withastro/astro/assets/2244813/ff10799f-a816-4703-b967-c78997e8323d)

<!-- dash-content-start -->

Create a blog with Astro and deploy it on Cloudflare Workers as a [static website](https://developers.cloudflare.com/workers/static-assets/).

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

<!-- dash-content-end -->

## Getting Started

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/frosty-boat-2c92
```

A live public deployment of this template is available at [https://frosty-boat-2c92.templates.workers.dev](https://frosty-boat-2c92.templates.workers.dev)

## 🚀 Project Structure

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run deploy`          | Deploy your production site to Cloudflare        |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).

---

# Astro & Cloudflare Implementation Guide

This guide walks through setting up a new Astro project and deploying it to Cloudflare Pages using the provided files.

## Step 1: Create a New Astro Project

Make sure you have Node.js v18.14.1 or higher.

```
npm create astro@latest
```

Recommended answers during the prompts:

- Where to create the project? → my-astro-site (or your choice)
- How to start? → Empty
- Install dependencies? → Yes
- TypeScript? → Your preference
- Initialize git? → Yes

## Step 2: Add Files to Your Project

Replace the placeholder files with the ones provided in this repo.

```
cd my-astro-site
rm src/pages/index.astro
mkdir -p src/layouts
```

Place the files:

- Move `Layout.astro` into `src/layouts/`.
- Move `index.astro` into `src/pages/`.

Expected structure:

```
my-astro-site/
├─ public/
├─ src/
│  ├─ layouts/
│  │  └─ Layout.astro
│  └─ pages/
│     └─ index.astro
├─ astro.config.mjs
├─ package.json
└─ ...
```

## Step 3: Add the Cloudflare Adapter

```
npx astro add cloudflare
```

This installs the necessary dependencies and updates `astro.config.mjs` for Cloudflare deployment.

## Step 4: Run Locally & Deploy

- Local dev: `npm run dev` → http://localhost:4321
- Deploy via Git + Cloudflare Pages:
  - Commit & push to GitHub/GitLab.
  - Create a new Pages project in Cloudflare and connect the repo.
  - Framework preset: Astro. Build: `npm run build`. Output: `dist`.

Your interactive AS-REP Roasting deep dive should now be live.
