# RelationTree

A modern, open-source React application for visualizing and editing family trees. It uses React Flow for an interactive, zoom-able canvas and SQLite/Prisma for lightweight persistent storage.

## Features
- **Interactive Graph:** Beautiful, dynamically arranged family tree visualizer.
- **Node Highlighting:** Clicking on individuals highlights immediate family members (spouse, children, parents) intuitively.
- **Local Storage:** SQLite via Prisma allows for an efficient, self-hosted backend.
- **Dark Mode:** A clean, built-in light/dark mode UI toggle.
- **JSON Export/Import:** Easily back up or import entire lineage graphs on the fly.

## Tech Stack
- React 19 + Vite
- React Flow (for graph visualization)
- Express + Node.js (Backend)
- SQLite + Prisma (Database ORM)
- Tailwind CSS / Vanilla CSS

## Setup Intructions

### 1. Configure the Environment
Copy the example `.env` file from the repository root:
```bash
cp .env.example .env
```
Fill in the `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. These credentials will act as your admin login to edit the family tree. 

### 2. Install dependencies
```bash
npm install
```

### 3. Initialize the database
Set up SQLite locally using Prisma. You will run this command once to build the `storage/dev.db` database automatically:
```bash
npx prisma db push
```

### 4. Build and Run
Start the development server. The frontend and backend run seamlessly together via Vite's proxy for local dev:

```bash
# Run the application in Dev Mode (Client & Backend concurrently) 
npm run dev
node server.js
```

In production, you would run `npm run build` and then boot `node server.js` to serve the static frontend app alongside the REST API.
