---
title: "Astro Components Deep Dive"
description: "Master Astro components - from basic syntax to advanced patterns for building reusable UI."
date: "Jan 16 2026"
tags: ["astro", "components", "tutorial"]
series: "Learning Astro"
seriesOrder: 2
---

Welcome back to the **Learning Astro** series! In this second part, we'll explore Astro components in depth.

## Anatomy of an Astro Component

Every Astro component has two parts:

1. **Component Script** (frontmatter) — JavaScript that runs at build time
2. **Component Template** — HTML output of your component

```astro
---
// Component Script (runs at build time)
const greeting = "Hello, World!";
const items = ["Apple", "Banana", "Cherry"];
---

<!-- Component Template -->
<div>
  <h1>{greeting}</h1>
  <ul>
    {items.map(item => <li>{item}</li>)}
  </ul>
</div>
```

## Props: Passing Data to Components

Components can accept props just like React or Vue:

```astro
---
// src/components/Button.astro
interface Props {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

const { variant = "primary", size = "md" } = Astro.props;
---

<button class:list={["btn", `btn-${variant}`, `btn-${size}`]}>
  <slot />
</button>
```

Use the component:

```astro
<Button variant="primary" size="lg">
  Click Me
</Button>
```

## Slots: Component Composition

Slots let you pass children to components:

### Default Slot

```astro
---
// Card.astro
---
<div class="card">
  <slot />
</div>
```

### Named Slots

```astro
---
// Card.astro
---
<div class="card">
  <header>
    <slot name="header" />
  </header>
  <main>
    <slot />
  </main>
  <footer>
    <slot name="footer" />
  </footer>
</div>
```

Usage:

```astro
<Card>
  <h2 slot="header">Card Title</h2>
  <p>Main content goes here.</p>
  <button slot="footer">Learn More</button>
</Card>
```

## Conditional Rendering

Astro supports standard JavaScript conditionals:

```astro
---
const isLoggedIn = true;
const items = [];
---

{isLoggedIn && <p>Welcome back!</p>}

{items.length > 0 ? (
  <ul>
    {items.map(item => <li>{item}</li>)}
  </ul>
) : (
  <p>No items found.</p>
)}
```

## Styling Components

### Scoped Styles

Styles in Astro are scoped by default:

```astro
<style>
  /* Only applies to this component */
  .card {
    padding: 1rem;
    border-radius: 8px;
  }
</style>
```

### Global Styles

Use `is:global` for global styles:

```astro
<style is:global>
  body {
    font-family: system-ui;
  }
</style>
```

## What's Next?

In the final post, we'll explore **Content Collections** - Astro's powerful system for managing blog posts and other content.

---

> **Pro tip**: Keep components small and focused. A good rule of thumb is that each component should do one thing well.
