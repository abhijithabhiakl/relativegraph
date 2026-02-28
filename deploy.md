# RelationTree: Deployment Guide & Overview

## Project Summary
**RelationTree** is a modern, responsive web application designed for visualizing and managing family trees.

### Core Features
- **Interactive Graph Rendering**: Utilizes `reactflow` to render family trees in a clean, Left-to-Right orientation. The graph algorithm groups siblings vertically with their parents, using elegant Bezier curves for parent-child connections and dashed `#e4094b` red arcs for spouses.
- **Mobile-First Experience**: Optimized for small screens with bottom-sheet modals, touch-friendly 44px+ hit areas, safe-area insets for modern phones, and immersive default zoom configurations.
- **Smart Highlighting**: Selecting any individual highlights their direct connections, including the spouse connection *between their parents*, making family units instantly clear.
- **Data Management**: All data is stored purely locally in the browser (`localStorage`) to guarantee privacy. It includes built-in `.json` export/import functionality to save off-line copies of the family record.
- **Admin System**: Viewing the tree is public. However, adding, editing, or deleting family members requires an admin login gated by an environment variable.
- **Tech Stack**: React 19, Vite, React Flow, Lucide React (icons). Pure CSS styling (no heavy UI frameworks) for maximal speed and simple customization.

---

## Deployment Instructions

Since the project uses Vite and relies on client-side routing and local storage, deployment is simply a matter of building the static assets and serving them.

### Prerequisites on Server
Ensure you have Node.js and npm installed on your server to build the bundle.

```bash
# Check version (Node.js 18+ is recommended)
node -v
npm -v
```

### 1. Setup Environment Variables
Before building, you need to set up the credentials required for the admin login to edit the family tree.

Create a `.env` file in the project root if it doesn't already exist:
```bash
cp .env.example .env
# or manually create and edit .env
nano .env
```
Inside the `.env` file, ensure the following variable is securely set:
```env
VITE_ADMIN_PASSWORD=your_secure_password_here
```

### 2. Install Dependencies
If you have just pulled the code to your server, install the node modules:
```bash
npm install
```

### 3. Build the Application
Run the Vite build command to generate the optimized, production-ready static files.
```bash
npm run build
```
This command will create a `dist/` folder in the project root. This folder contains the final HTML, CSS, and minified JS files.

### 4. Provide to Nginx
The contents of the `dist/` directory are what you need to serve.

*   You can configure Nginx to point its `root` directive directly to the `/path/to/relativegraph/dist` folder.
*   Alternatively, you can copy the contents of the `dist` folder to your standard web root (e.g., `/var/www/html/relationtree`).

**Important Nginx Note (Client-Side Routing):**
Because this is a Single Page Application (SPA), ensure your Nginx location block includes `try_files $uri $uri/ /index.html;`. This forces Nginx to route all traffic back to `index.html` so React can handle the rendering, preventing 404 errors when visitors refresh on specific sub-URL states.
