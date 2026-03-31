# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based CV template called "Astro-CV-Esquelete" - a personal portfolio/resume website with a clean, accordion-style design. The project uses Astro 5 with TailwindCSS, daisyUI, and server-side rendering for Vercel deployment.

## Development Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Architecture

### Content Management System
The site uses a file-based CMS where all content is stored as Markdown files in `/src/pages/` subdirectories:
- `/src/pages/about/` - Personal information
- `/src/pages/works/` - Work experience
- `/src/pages/projects/` - Projects portfolio
- `/src/pages/studies/` - Education
- `/src/pages/certificates/` - Certifications
- `/src/pages/blogs/` - Blog posts
- `/src/pages/contact/` - Contact information

Each markdown file uses frontmatter for metadata (title, date, tags, url, org, location, institute, icon).

### Component Architecture
- **Container.astro** (`src/components/Container.astro`): Main content orchestrator that dynamically imports all markdown content using `import.meta.glob()` and renders accordion sections
- **AccordionLayout.astro** (`src/layouts/AccordionLayout.astro`): Reusable accordion component for each CV section
- **Card.astro**: Individual content item display component
- **ContactCard.astro**: Specialized component for contact information
- **BaseLayout.astro**: Main page layout wrapper
- **Header.astro** & **Footer.astro**: Site header and footer components

### Key Technical Details
- Uses Astro's file-based routing with dynamic content loading via `import.meta.glob()`
- Server-side rendering configured for Vercel deployment
- Theme switching between "black" and "lofi" themes using daisyUI and theme-change library
- Responsive design with TailwindCSS utilities
- Icon system using astro-icon with Carbon icons
- PDF resume display and download functionality

### Adding/Removing Content Sections
To add a new CV section:
1. Create new markdown files in `/src/pages/[section-name]/`
2. Add corresponding `import.meta.glob()` import in `Container.astro`
3. Add new `<AccordionLayout>` component with appropriate props

To remove a section: Comment out or delete the corresponding `<AccordionLayout>` block in `Container.astro`.

### Styling System
- Uses daisyUI components with custom theme configurations in `tailwind.config.mjs`
- DM Sans font family as primary typography
- Custom rounded borders and secondary color overrides for themes
- Astro-compress integration for production optimization

### Print Functionality
The site includes comprehensive print support:

**Print-friendly accordion behavior:**
- All accordion sections automatically open when printing
- Special CSS overrides force `.collapse-content` to display fully
- Accordion arrows and checkboxes are hidden in print mode

**Print-hidden sections:**
- Use `printHidden={true}` prop on `<AccordionLayout>` components to hide sections from print
- Example: The "Files" section is hidden from print by default since PDFs don't print well

**Print styling optimizations:**
- Font size optimized for print (12px)
- Black text on white background
- Border styling for better section separation
- Removed shadows, transitions, and interactive elements
- Page break avoidance for cards and sections
- Hidden theme toggle and buttons

**Usage example:**
```astro
<!-- This section will be hidden when printing -->
<AccordionLayout title={"Files"} icon={"carbon:volume-file-storage"} printHidden={true}>
  <!-- content -->
</AccordionLayout>

<!-- This section will be visible and open when printing -->
<AccordionLayout title={"Work"} icon={"carbon:construction"}>
  <!-- content -->
</AccordionLayout>
```

### Deployment
Configured for Vercel with:
- Server output mode
- Vercel adapter
- Custom build configuration in `vercel.json`