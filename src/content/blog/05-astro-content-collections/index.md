---
title: "Astro Content Collections"
description: "Learn how to use Content Collections for type-safe content management in Astro."
date: "Jan 17 2026"
tags: ["astro", "content", "tutorial"]
series: "Learning Astro"
visible: false
seriesOrder: 3
---

Welcome to the final post in the **Learning Astro** series! Today we'll master Content Collections - Astro's built-in solution for managing structured content.

## What are Content Collections?

Content Collections provide a way to organize and query your content (like blog posts) with full TypeScript support. They live in `src/content/`.

## Setting Up a Collection

### 1. Create the Directory

```
src/content/
├── blog/
│   ├── my-first-post.md
│   └── my-second-post.md
└── config.ts
```

### 2. Define the Schema

Create `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

## Creating Content

Each markdown file in `src/content/blog/` needs frontmatter matching your schema:

```markdown
---
title: "My Amazing Post"
description: "A short description"
date: "2024-01-15"
tags: ["tutorial", "astro"]
---

Your content here...
```

## Querying Collections

### Get All Posts

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
---

<ul>
  {posts.map(post => (
    <li>
      <a href={`/blog/${post.slug}`}>{post.data.title}</a>
    </li>
  ))}
</ul>
```

### Filter and Sort

```astro
---
const publishedPosts = await getCollection('blog', ({ data }) => {
  return !data.draft;
});

const sortedPosts = publishedPosts.sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
);
---
```

### Get a Single Entry

```astro
---
import { getEntry } from 'astro:content';

const post = await getEntry('blog', 'my-first-post');
---
```

## Rendering Content

Use the `render()` function to get the content component:

```astro
---
import { getEntry } from 'astro:content';

const post = await getEntry('blog', 'my-first-post');
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

## Dynamic Routes

Create `src/pages/blog/[...slug].astro`:

```astro
---
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: post,
  }));
}

const post = Astro.props;
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

## Advanced: References Between Collections

You can reference other collections:

```typescript
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    author: reference('authors'), // Reference to authors collection
  }),
});
```

## Series Complete! 🎉

Congratulations on completing the **Learning Astro** series! You now know:

1. ✅ How to set up an Astro project
2. ✅ Building reusable components
3. ✅ Managing content with Collections

---

> **What's next?** Try building your own blog with what you've learned! Check out the [Astro docs](https://docs.astro.build) for more advanced features.
