---
title: "make-bill"
description: "API first PDF generation service"
date: "Jan 2026"
demoURL: "https://make-bill.vercel.app"
repoURL: "https://github.com/pratikstemkar/make-bill"
technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Puppeteer"]
---

**Design invoices visually. Generate PDFs via API.**

> Stop wrestling with wkhtmltopdf configs and Puppeteer headaches. `make-bill` is an open-source, visual invoice builder with an API-first approach to PDF generation.

---

## 🎯 What is make-bill?

Have you ever spent hours trying to generate pixel-perfect invoices programmatically? Fought with HTML-to-PDF libraries that never quite render things correctly? **make-bill** was built to solve exactly that.

It's a modern web application that combines:
- A **visual drag-and-drop editor** for designing invoice templates
- **Pixel-perfect PDF generation** via a simple REST API
- **Dynamic data binding** so your templates come alive with real data

Think of it as Canva meets Stripe Invoices—design once, generate forever.

---

## ✨ Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎨 **Visual Editor** | Drag-and-drop interface with absolute positioning on an A4 canvas |
| 📐 **Multiple Page Sizes** | A4, A3, A5, Letter, Legal—with portrait and landscape orientations |
| 🔗 **Data Binding** | Bind text fields to data paths like `invoice.customer.name` |
| 📊 **Tables** | Dynamic tables that expand with your data arrays |
| 🖼️ **Images** | Upload logos, signatures, or any image assets |
| 📄 **PDF Generation** | Server-side rendering with Puppeteer for consistent output |
| 💾 **Template Management** | Save, load, and version your templates |
| 🔐 **Authentication** | Supabase-powered user authentication |
| ⚡ **REST API** | Generate PDFs programmatically with a single POST request |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **Bun** (recommended) or npm/yarn/pnpm
- A **Supabase** project (for authentication and template storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/pratikstemkar/make-bill.git
   cd make-bill
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   Your `.env.local` should contain:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**

   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) and start building!

---

## 🎨 Using the Visual Editor

The heart of make-bill is its visual editor. Here's how to create your first template:

### 1. Open the Editor

Click **"Open Editor"** from the landing page or navigate directly to `/editor`.

### 2. Add Elements

The left panel contains your toolbox. Drag elements onto the canvas:

- **Text** — Static text or dynamic data bindings
- **Image** — Upload logos, product images, or signatures
- **Line** — Horizontal separators for visual structure
- **Table** — Dynamic tables that expand with your data

### 3. Configure Page Settings

At the top of the left panel, configure your document:

- **Page Size** — A4, A3, A5, Letter, or Legal
- **Orientation** — Portrait or Landscape
- **Margins** — Control the printable area

### 4. Bind Data to Elements

Select a text element and use the Inspector panel (right side) to set a **binding path**:

```
invoice.customer.name
invoice.number
invoice.date
invoice.total
```

When you generate the PDF via API, these placeholders are replaced with actual data.

### 5. Preview Your Template

Click **"Preview"** to see how your invoice will look with sample data.

### 6. Save Your Template

Hit **"Save Template"** to persist your design. Templates are versioned, so you can iterate without breaking existing integrations.

---

## 📡 API Usage

Once you've designed and saved a template, generate PDFs with a simple HTTP request.

### Generate a PDF

```bash
curl -X POST https://your-domain.com/api/generate-pdf \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "invoice_v1",
    "data": {
      "invoice": {
        "number": "INV-2024-001",
        "date": "2024-01-15",
        "customer": {
          "name": "Acme Corporation",
          "address": "123 Business Street"
        },
        "items": [
          { "name": "Consulting Services", "qty": 10, "price": 150 },
          { "name": "Development Work", "qty": 20, "price": 100 }
        ],
        "total": 3500
      }
    }
  }'
```

### Response

The API returns the PDF as a binary stream with `Content-Type: application/pdf`.

---

## 📐 Element Types

### Text Element

Static or dynamic text content.

```typescript
{
  type: "text",
  content: "Invoice",           // Static content
  binding: "invoice.number",    // OR dynamic binding
  fontSize: 16,
  fontWeight: "bold" | "normal",
  align: "left" | "center" | "right"
}
```

### Image Element

Embed images with optional aspect ratio locking.

```typescript
{
  type: "image",
  src: "https://...",          // Image URL or base64
  maintainAspectRatio: true
}
```

### Line Element

Horizontal separator lines.

```typescript
{
  type: "line",
  thickness: 2                 // Line thickness in pixels
}
```

### Table Element

Dynamic tables bound to an array in your data.

```typescript
{
  type: "table",
  columns: ["Item", "Qty", "Price"],
  binding: "invoice.items"     // Path to array data
}
```

---

## 🏗️ Project Structure

```
make-bill/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (PDF generation, etc.)
│   ├── editor/            # Visual template editor
│   ├── login/             # Authentication pages
│   ├── templates/         # Template management
│   └── page.tsx           # Landing page
├── components/
│   ├── editor/            # Editor components (Canvas, Inspector, etc.)
│   ├── preview/           # PDF preview components
│   └── ui/                # Reusable UI components (shadcn/ui)
├── lib/
│   ├── api/               # API client utilities
│   ├── htmlGenerator.ts   # Server-side HTML generation for PDFs
│   ├── types.ts           # TypeScript type definitions
│   └── supabase/          # Supabase client configuration
├── hooks/                 # Custom React hooks
└── store/                 # Zustand state management
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui + Radix UI |
| **State Management** | Zustand |
| **Authentication** | Supabase Auth |
| **Database** | Supabase (PostgreSQL) |
| **PDF Generation** | Puppeteer Core + @sparticuz/chromium |
| **Icons** | Lucide React |
| **Notifications** | Sonner |

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

---

## 📦 Available Scripts

```bash
# Development server
bun dev

# Production build
bun run build

# Start production server
bun start

# Lint the codebase
bun run lint
```

---

## 🚢 Deployment

### Vercel (Recommended)

make-bill is optimized for Vercel deployment. Simply connect your GitHub repository and Vercel will handle the rest.

> **Note:** PDF generation uses `@sparticuz/chromium` which is specifically optimized for serverless environments like Vercel Functions.

### Other Platforms

For other platforms, ensure you have:
- Node.js 18+ runtime
- Sufficient memory for Puppeteer (512MB+ recommended)
- Proper environment variable configuration

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug fixes, new features, or documentation improvements—we'd love to have your help.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source. Feel free to use, modify, and distribute as needed.

---

## 💡 Why make-bill?

Because generating invoices should be **simple**.

No more:
- ❌ Wrestling with wkhtmltopdf configurations
- ❌ Debugging CSS rendering differences in headless Chrome
- ❌ Manually crafting HTML templates with complex positioning
- ❌ Dealing with font embedding issues

Instead:
- ✅ Design visually, see exactly what you'll get
- ✅ One API call to generate a PDF
- ✅ Consistent, pixel-perfect output every time
- ✅ Templates that non-developers can update

---

<p align="center">
  Built with ❤️ for developers who hate fighting with PDF libraries.
</p>