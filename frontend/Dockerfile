# ============================================================
#  Frontend — React 19 + Vite 7
#  Multi-stage build: compile static files, serve with nginx.
# ============================================================

# ---- Stage 1: Build the static site ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfiles first so the npm install layer is cached
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source and produce the production build (outputs to /app/dist)
COPY . .
RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine

# Replace the default nginx config with our SPA + API-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled static files into nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx serves the app on port 80
EXPOSE 80

# Run nginx in the foreground (required for containers)
CMD ["nginx", "-g", "daemon off;"]
