# Software Engineering 2: Final Project
**The Forge: Digital Academic Works Repository**

A full-stack academic repository platform for De La Salle Lipa researchers to upload, archive, and discuss thesis work. Built with React + TypeScript and powered by Supabase.
Check it out on [Cloudflare Workers & Pages](https://the-forge.cppdecl.workers.dev/).

**Note:** This project is developed as a final requirement for Software Engineering 2.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, TanStack Router, Tailwind CSS v4
- **Build Tool:** Vite 7
- **Backend & Auth:** Supabase (PostgreSQL, Auth, Storage)
- **UI Components:** Radix UI, Lucide React, Sonner
- **Forms:** React Hook Form + Zod

---

## Features

- **PDF Archive** — Upload and host research papers with metadata, abstracts, and file storage via Supabase Storage
- **Co-Author Tagging** — Search and tag every collaborator on a thesis; all authors are properly credited and visible
- **Researcher Profiles** — Each user has a public profile with their academic affiliation, bio, social links, and a portfolio of submitted works
- **Star System** — Users can star thesis projects they find valuable; the most-starred works are surfaced on the Featured page
- **Open Discussions** — Every thesis has its own comment thread where the community can ask questions and engage with the authors
- **Authentication** — Google OAuth via Supabase Auth with automatic profile creation on first sign-in
- **Dashboard** — Logged-in users can manage their own submitted theses, track stars, and view their activity

---

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Run `npm install`
4. Run `npm run dev`

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |