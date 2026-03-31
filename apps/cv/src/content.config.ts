import { defineCollection, z } from "astro:content";

const about = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    name: z.string(),
    designation: z.string(),
    location: z.string(),
    website: z.string().optional(),
  }),
});

const works = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.number()]).transform(String).optional(),
    tags: z.array(z.string()).optional(),
    url: z.string().optional(),
    org: z.string().optional(),
    location: z.string().optional(),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.number()]).transform(String).optional(),
    tags: z.array(z.string()).optional(),
    url: z.string().optional(),
  }),
});

const education = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.number()]).transform(String).optional(),
    tags: z.array(z.string()).optional(),
    url: z.string().optional(),
    location: z.string().optional(),
    institute: z.string().optional(),
  }),
});

const certificates = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.number()]).transform(String).optional(),
    tags: z.array(z.string()).optional(),
    url: z.string().optional(),
    org: z.string().optional(),
  }),
});

const blogs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const contact = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    url: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const collections = {
  about,
  works,
  projects,
  education,
  certificates,
  blogs,
  contact,
};
