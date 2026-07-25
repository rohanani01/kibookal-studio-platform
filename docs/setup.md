# Setup

## Prerequisites

- Node.js 18 or higher
- npm (bundled with Node)

## Install

```bash
cd kibookal-studio-platform
npm install
cp .env.example .env
npm run db:migrate
npm run health
```

## Run

```bash
# Terminal 1 — backend on :3001
npm run backend

# Terminal 2 — frontend on :8770
npm run frontend
```

Open `http://localhost:8770`.

## First project

```bash
npm run create:project -- "The Butter Thief" comic-book "Indian folk comic adventure"
```

This creates `storage/projects/comic-books/the-butter-thief/` with the full sub-folder template + a DB row.
