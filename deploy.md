# RelationTree: Deployment Guide & Overview

## Project Summary
**RelationTree** is a modern, responsive web application designed for visualizing and managing family trees.

### Core Features
- **Interactive Graph Rendering**: Utilizes `reactflow` to render family trees in a clean, Left-to-Right orientation. The graph algorithm groups siblings vertically with their parents, using elegant Bezier curves for parent-child connections and dashed `#e4094b` red arcs for spouses.
- **Mobile-First Experience**: Optimized for small screens with bottom-sheet modals, touch-friendly 44px+ hit areas, safe-area insets for modern phones, and immersive default zoom configurations.
- **Smart Highlighting**: Selecting any individual highlights their direct connections, including the spouse connection *between their parents*, making family units instantly clear.
- **Data Management**: Data is securely synchronized across all devices using a Node JS backend server. The backend securely saves the graph in a local `data.json` file.
- **Admin System**: Viewing the tree is public. However, adding, editing, or deleting family members requires an admin login gated by an environment variable. Authentication is checked server-side, ensuring credentials remain hidden from public web traffic.
- **Tech Stack**: React 19, Vite, Express (Node JS backend), React Flow, Lucide React (icons). Pure CSS styling.

---

## Comprehensive Deployment Instructions (for Home Servers)

Since the application requires data synchronization and secure credentials, we deploy it using the included Node.js server. The server serves the compiled React application and provides the necessary API for reading/writing `data.json`.

### Prerequisites on Server
Ensure you have Node.js and npm installed on your server (e.g., Ubuntu, Debian, Raspberry Pi OS).

```bash
# Update package list and install Node.js (Version 18+ recommended)
sudo apt update
sudo apt install nodejs npm -y

# Verify installation
node -v
npm -v
```

### 1. Clone or Copy the Project
Transfer your project files to your server (e.g., `/home/username/relativegraph` or `/var/www/relativegraph`). Navigate to the folder:

```bash
cd /your/path/to/relativegraph
```

### 2. Setup Environment Variables
Before building, you need to set up the credentials required for the admin login to edit the family tree.

Create a `.env` file in the project root:
```bash
nano .env
```
Inside the `.env` file, ensure the following variables are securely set. We will use port `3308` (or any available port) for our backend server.
```env
ADMIN_EMAIL=your_email@example.com
ADMIN_PASSWORD=your_secure_password_here
PORT=3308
```
*(Note: Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit nano).*

### 3. Install Dependencies
Install all required Node modules for the project to run:
```bash
npm install
```

### 4. Build the Application
Run the Vite build command to generate the optimized, production-ready frontend assets.
```bash
npm run build
```
This command creates a `dist/` folder in the project root containing the HTML, CSS, and JS files. The Express server is configured to automatically serve these files.

### 5. Running the Server (with PM2)
To keep the server running smoothly in the background, even if the server restarts, we use a process manager called PM2.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the Node backend in the background
pm2 start server.js --name "relationtree"

# Tell PM2 to save the current processes and start on boot
pm2 save
pm2 startup
```
*(Note: The `pm2 startup` command will print another command you need to copy and paste to finalize the startup script).*

### 6. Setup Reverse Proxy with Nginx
For production, you should expose your Node app securely through Nginx on standard web ports (80/443).

**1. Install Nginx:**
```bash
sudo apt install nginx -y
```

**2. Create a configuration file for your site:**
```bash
sudo nano /etc/nginx/sites-available/relationtree
```

**3. Paste the following configuration:**
*(Ensure you replace `tree.yourdomain.com` with your actual domain or local IP, and update the `root` path to exactly where your project's `dist` folder lives).*

```nginx
server {
    listen 80;
    server_name tree.yourdomain.com; # Replace with your domain

    # Optional: Redirect HTTP to HTTPS (if you have SSL set up)
    # return 301 https://$host$request_uri;

    # The location blocks below serve the app if you are NOT using HTTPS.
    # If using HTTPS, move these blocks into the port 443 server block below.
    
    # Update this path to the absolute path of your 'dist' folder
    root /your/path/to/relativegraph/dist;
    index index.html;

    # This routes database sync requests to the Node server (Port 3308)
    location /api/ {
        proxy_pass http://localhost:3308;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serves the built React App frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Efficient caching for static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# -------------------------------------------------------------
# Optional: HTTPS Configuration (Requires SSL Certificates)
# -------------------------------------------------------------
# server {
#     listen 443 ssl http2;
#     server_name tree.yourdomain.com;
#
#     ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#
#     root /your/path/to/relativegraph/dist;
#     index index.html;
#
#     location /api/ { proxy_pass http://localhost:3308; ... }
#     location / { try_files $uri $uri/ /index.html; }
#     location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
# }
```

**4. Enable the site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/relationtree /etc/nginx/sites-enabled/
sudo nginx -t     # This checks for syntax errors
sudo systemctl restart nginx
```

If the syntax check `nginx -t` passes and Nginx restarts successfully, your family tree is now live and accessible from any device!
