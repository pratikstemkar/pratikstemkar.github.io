import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    visible: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    references: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .optional(),
  }),
});

const work = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
    technologies: z.array(z.string()).optional(),
  }),
});

const travels = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    location: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    cover: z.string(),
    images: z
      .array(
        z.object({
          src: z.string(),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { blog, work, projects, travels };
