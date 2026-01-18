---
title: "Getting Started with Astro"
description: "A beginner's guide to building fast websites with Astro - the modern static site generator."
date: "Jan 15 2026"
tags: ["astro", "web-dev", "tutorial"]
series: "Learning Astro"
seriesOrder: 1
---

Welcome to the **Learning Astro** series! In this first post, we'll explore what makes Astro special and get you up and running with your first project.

## What is Astro?

Astro is a modern static site generator that delivers lightning-fast performance by shipping zero JavaScript by default. It's perfect for content-focused websites like blogs, documentation, and portfolios.

### Key Features

- **Zero JS by default** — Ship only the JavaScript you need
- **Component Islands** — Interactive components in a sea of static HTML
- **Framework agnostic** — Use React, Vue, Svelte, or vanilla JS
- **Content Collections** — Type-safe content management
- **Built-in optimizations** — Images, fonts, and assets are optimized automatically

## Setting Up Your First Project

Let's create a new Astro project:

```bash
# Create a new project
npm create astro@latest my-blog

# Navigate to the project
cd my-blog

# Start the dev server
npm run dev
```

Your site is now running at `http://localhost:4321`!

## Project Structure

An Astro project typically looks like this:

```
my-blog/
├── src/
│   ├── components/   # Reusable UI components
│   ├── layouts/      # Page layouts
│   ├── pages/        # Routes (file-based routing)
│   └── content/      # Content collections (blog posts, etc.)
├── public/           # Static assets
└── astro.config.mjs  # Configuration
```

## Understanding Pages

In Astro, every `.astro` file in `src/pages/` becomes a route:

```astro
---
// src/pages/about.astro
const title = "About Me";
---

<html>
  <head>
    <title>{title}</title>
  </head>
  <body>
    <h1>{title}</h1>
    <p>Welcome to my site!</p>
  </body>
</html>
```

This creates a page at `/about`.

## What's Next?

In the next post, we'll dive deep into **Astro Components** - the building blocks of every Astro site.

---

> **Tip**: Astro's dev server includes hot module replacement (HMR), so your changes appear instantly in the browser!
