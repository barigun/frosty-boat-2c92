# Changelog

All notable changes to this project are documented here.

## 2025-09-01

- Layout: Switch blog index to a vertical list and simplify styles
  - Files: `src/pages/blog/index.astro`
  - Replaced tile/grid with a clean list of title + date, improved hover and mobile behavior.

- Reading Width: Use character-based measure for post content
  - Files: `src/layouts/BlogPost.astro`
  - `.prose` now uses `max-width: min(72ch, calc(100% - 2em))` for optimal readability.

- Post Fix: Normalize slug and content for LsaCallAuthenticationPackage article
  - Files: `src/content/blog/analysis-of-lsacallauthenticationpackage.md`
  - Renamed file to a lowercase hyphenated slug; removed page-level HTML, kept Markdown + code blocks.

- Interactive Article: Keep original functionality without Tailwind
  - Files: `src/content/blog/second-post.md`
  - Rebuilt sections with scoped CSS and vanilla JS (sticky nav, analogy buttons, attack simulation typing effect) to work within the site layout.

- Branding: Replace generic placeholders with custom assets
  - Files: `public/blog-placeholder-1.svg`, `src/components/BaseHead.astro`, `src/content/blog/markdown-style-guide.md`
  - Added SVG banner (no text for logo use) and set it as default Open Graph image; updated style guide hero.

- Favicon: Custom shield + code-brackets logo (dark-mode aware)
  - Files: `public/favicon.svg`
  - Replaces default Astro icon with a minimalist, high-contrast mark.

- Security: Add response headers middleware
  - Files: `src/middleware.ts`
  - Adds CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP/CORP, etc.
  - Note: CSP currently allows `'unsafe-inline'` for scripts/styles to support interactive content; plan to tighten by moving inline JS to components and using nonces.

- Housekeeping: Remove legacy JPG placeholder
  - Files: `public/blog-placeholder-1.jpg`

## Next Hardening (optional)

- Tighten CSP by removing `'unsafe-inline'` after migrating inline scripts to components with nonces.
- Add a Markdown link transformer to set `rel="noopener noreferrer"` and `target="_blank"` for external links.
- Add social image PNG fallback for improved sharing compatibility (keep SVG for in-site usage).
