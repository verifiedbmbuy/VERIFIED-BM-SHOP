# VBB STORE — Project Documentation

> **Last updated:** February 15, 2026  
> **Stack:** React 18 · Vite · TypeScript · Tailwind CSS · Lovable Cloud (Supabase)

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Roles](#authentication--roles)
6. [Edge Functions](#edge-functions)
7. [Key Features](#key-features)
8. [Design System](#design-system)

---

## Overview

VBB STORE is a full-stack e-commerce and content platform for selling verified business manager accounts. It includes a public storefront, blog with comments, and a full admin CMS with role-based access control (RBAC), product management, analytics dashboard, and email notifications.

---

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

### Local-Only Safety Setup (No Live Auto Sync)

1. Copy `.env.local.example` to `.env.local`.
2. Put your **dev** Supabase URL and anon key in `.env.local`.
3. Keep `VITE_ALLOW_PROD_DATA_IN_DEV="false"` (or unset).
4. Keep `VITE_BLOCK_WRITES_IN_DEV="true"` (default safety).

This project has a startup safety check that blocks localhost if it is pointed to the production Supabase project.

When localhost still points to production Supabase, write operations are blocked in development by default (except auth endpoints), so browsing works but accidental data mutations are prevented.

### Controlled Production Deploy

`.cpanel.yml` deploy tasks now run only when a marker file named `.deploy-live` exists in the repo root.

- No `.deploy-live` file: deploy is skipped.
- `.deploy-live` file present: deploy copies `dist`, `.htaccess`, and `media-proxy.php` to production.

This prevents accidental live publish from normal development pushes.

### Pre-Push Safety Guard

This project includes a pre-push guard to reduce accidental production sync:

1. Run `npm run hooks:install` once in your git repo.
2. On every push, `.githooks/pre-push` runs `npm run guard:push`.

The guard blocks push when it finds risky conditions like:

- `.deploy-live` marker exists in project root.
- `.env` is tracked by git.
- Tracked env files reference production Supabase URL.
- Tracked env files set `VITE_ALLOW_PROD_DATA_IN_DEV=true`.

Or open in [Lovable](https://lovable.dev) and start prompting.

---

## Folder Structure

```
├── public/
│   ├── favicon.ico / favicon.png     # Site icons
│   ├── placeholder.svg               # Fallback image
│   └── robots.txt                    # SEO crawler rules
│
├── src/
│   ├── App.tsx                       # Root router — all routes defined here
│   ├── main.tsx                      # Entry point (ErrorBoundary wrapper)
│   ├── index.css                     # Design tokens (HSL colors, dark mode)
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx       # Sidebar + header shell for /admin/*
│   │   │   ├── MediaLibrary.tsx      # Full media manager (upload, list, delete)
│   │   │   ├── MediaLibraryModal.tsx # Modal wrapper for media picker
│   │   │   └── SEOSettingsPanel.tsx  # Meta title/desc/keyword panel
│   │   │
│   │   ├── blog/
│   │   │   └── CommentSection.tsx    # Public comment form + approved list
│   │   │
│   │   ├── home/                     # 16 homepage section components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProductsSection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   └── ... (13 more)
│   │   │
│   │   ├── layout/
│   │   │   ├── Layout.tsx            # Public wrapper (Navbar + Footer + WhatsApp)
│   │   │   ├── Navbar.tsx            # Top nav with search toggle
│   │   │   ├── Footer.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── WhatsAppButton.tsx    # Floating CTA
│   │   │
│   │   ├── seo/
│   │   │   └── SEOHead.tsx           # react-helmet-async wrapper
│   │   │
│   │   ├── shared/
│   │   │   └── ProductCard.tsx       # Reusable product card
│   │   │
│   │   ├── ui/                       # ~40 shadcn/ui primitives
│   │   ├── ErrorBoundary.tsx         # Global crash handler
│   │   └── NavLink.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth state, RBAC, signIn/signOut
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx            # Responsive breakpoint hook
│   │   └── use-toast.ts
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts                 # Auto-generated Supabase client
│   │   └── types.ts                  # Auto-generated DB types
│   │
│   ├── lib/
│   │   └── utils.ts                  # cn() Tailwind merge utility
│   │
│   ├── pages/
│   │   ├── Index.tsx                 # Homepage
│   │   ├── Shop.tsx                  # Product grid with filters
│   │   ├── Blog.tsx                  # Blog listing
│   │   ├── BlogPost.tsx              # Single post + comments
│   │   ├── ProductDetail.tsx         # Single product page
│   │   ├── Contact.tsx               # Contact form
│   │   ├── About.tsx
│   │   ├── Search.tsx                # Global search results
│   │   ├── NotFound.tsx              # 404 page
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboard.tsx    # Stats + Recharts bar/pie charts
│   │       ├── AdminPosts.tsx        # Blog post list + delete
│   │       ├── AdminPostEditor.tsx   # Tiptap rich text editor + SEO
│   │       ├── AdminProducts.tsx     # Product CRUD (table + dialog)
│   │       ├── AdminComments.tsx     # Comment moderation
│   │       ├── AdminPages.tsx        # Static page manager
│   │       ├── AdminMedia.tsx        # Media library page
│   │       ├── AdminUsers.tsx        # User/role management
│   │       ├── AdminSettings.tsx     # Site settings
│   │       └── AdminLogin.tsx        # Email/password login
│   │
│   └── test/
│       ├── setup.ts
│       └── example.test.ts
│
├── supabase/
│   ├── config.toml                   # Supabase config (auto-managed)
│   ├── migrations/                   # SQL migrations (auto-managed)
│   └── functions/
│       ├── sitemap/index.ts          # Dynamic XML sitemap
│       └── notify/index.ts           # Email notification processor
│
├── tailwind.config.ts
├── vite.config.ts
└── vitest.config.ts
```

---

## Database Schema

### `products`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | gen_random_uuid() |
| title | text | No | — |
| slug | text | No | — |
| description | text | Yes | — |
| short_description | text | Yes | — |
| price | numeric | No | — |
| sale_price | numeric | Yes | — |
| category | text | No | 'Verified BM' |
| badge | text | Yes | — |
| image_url | text | Yes | — |
| rating | numeric | Yes | 5.0 |
| sort_order | integer | Yes | 0 |
| is_featured | boolean | Yes | false |
| created_at | timestamptz | No | now() |

**RLS:** Public SELECT · Admin INSERT/UPDATE/DELETE

### `blog_posts`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | gen_random_uuid() |
| title | text | No | — |
| slug | text | No | — |
| content | text | Yes | — |
| excerpt | text | Yes | — |
| featured_image | text | Yes | — |
| category | text | No | 'Verified BM' |
| author | text | No | 'Admin' |
| status | text | No | 'draft' |
| read_time | text | Yes | '5 min read' |
| meta_title | text | Yes | — |
| meta_description | text | Yes | — |
| focus_keyword | text | Yes | — |
| user_id | uuid | Yes | — |
| published_at | timestamptz | Yes | now() |
| created_at | timestamptz | No | now() |

**RLS:** Public SELECT · Authenticated INSERT · Author own / Editor+Admin UPDATE/DELETE

### `comments`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | gen_random_uuid() |
| post_id | uuid (FK → blog_posts) | No | — |
| author_name | text | No | — |
| author_email | text | No | — |
| content | text | No | — |
| status | text | No | 'pending' |
| created_at | timestamptz | No | now() |

**RLS:** Public SELECT (approved) · Public INSERT · Admin/Editor full access  
**FK:** post_id → blog_posts.id ON DELETE CASCADE

### `contact_messages`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | gen_random_uuid() |
| name | text | No | — |
| email | text | No | — |
| subject | text | No | — |
| message | text | No | — |
| created_at | timestamptz | No | now() |

**RLS:** Public INSERT · Admin/Editor SELECT

### `media_files`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | gen_random_uuid() |
| file_name | text | No | — |
| file_path | text | No | — |
| url | text | No | — |
| mime_type | text | No | 'image/jpeg' |
| file_size | integer | No | 0 |
| width | integer | Yes | — |
| height | integer | Yes | — |
| alt_text | text | Yes | '' |
| caption | text | Yes | '' |
| created_at | timestamptz | No | now() |

**RLS:** Public SELECT · Editor/Admin INSERT/UPDATE/DELETE

### `profiles`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | = auth.users.id |
| full_name | text | No | '' |
| avatar_url | text | Yes | — |
| is_active | boolean | No | true |
| last_login | timestamptz | Yes | — |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |

**RLS:** Public SELECT · Own or Admin UPDATE · Admin INSERT

### `user_roles`
| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid (PK) | No | gen_random_uuid() |
| user_id | uuid | No | — |
| role | app_role enum | No | 'author' |

**Enum values:** `admin` · `editor` · `author`  
**RLS:** Authenticated SELECT · Admin INSERT/UPDATE/DELETE

### Database Functions & Triggers

| Function | Purpose |
|---|---|
| `has_role(user_id, role)` | SECURITY DEFINER — checks role without RLS recursion |
| `get_user_role(user_id)` | Returns user's role |
| `reassign_posts_on_user_delete()` | Trigger: sets deleted user's posts to author='Anonymous' |

---

## Authentication & Roles

| Role | Access |
|---|---|
| Admin | Full access: all sections, user management |
| Editor | Dashboard, Posts, Pages, Media, Comments |
| Author | Dashboard, own Posts only |

- Auth via `AuthContext.tsx` with email/password
- Route protection in `AdminLayout.tsx` → redirects to `/admin/login`
- Logout clears session → redirects to `/`

---

## Edge Functions

| Function | Endpoint | Purpose |
|---|---|---|
| `sitemap` | `/functions/v1/sitemap` | Dynamic XML sitemap from products + blog posts |
| `notify` | `/functions/v1/notify` | Processes notifications (contact, publish, comment) |

---

## Key Features

- **Product CRUD** — Admin create, edit, delete products via dialog form
- **Blog CMS** — Tiptap rich text editor with autosave, SEO panel, media picker
- **Comments** — Public commenting with admin moderation (approve/reject/delete)
- **Analytics Dashboard** — Real-time stats with Recharts bar + pie charts
- **Media Library** — Upload, browse, delete images (JPG/PNG/WebP < 10MB)
- **Global Search** — Searches products and blog posts
- **SEO** — Meta tags, Google preview, sitemap edge function
- **Security** — RLS on all tables, DOMPurify sanitization, ErrorBoundary, post reassignment on user deletion

---

## Design System

- **Primary:** `hsl(217, 91%, 60%)` — Blue
- **Tokens** in `src/index.css` (light + dark mode support)
- **Components:** shadcn/ui in `src/components/ui/`
- **Responsive:** Mobile-first, collapsible admin sidebar
