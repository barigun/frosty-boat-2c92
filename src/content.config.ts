import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    // Allow absolute http(s) URLs or root-relative paths (e.g. "/as-rep-roasting-attack/")
    externalUrl: z
      .string()
      .refine((val) => /^https?:\/\//i.test(val) || val.startsWith('/'), {
        message: 'Must be an absolute http(s) URL or root-relative path',
      })
      .optional(),
    // Hide from listings and/or build
    unlisted: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// New collection: interactive articles (MD/MDX entries that can link to routed HTML pages)
const interactive = defineCollection({
  loader: glob({ base: "./src/content/interactive", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    externalUrl: z
      .string()
      .refine((val) => /^https?:\/\//i.test(val) || val.startsWith('/'), {
        message: 'Must be an absolute http(s) URL or root-relative path',
      })
      .optional(),
    unlisted: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, interactive };
