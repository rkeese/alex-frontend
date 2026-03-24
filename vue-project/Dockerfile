# --- Stage 1: Build ---
FROM node:20-alpine AS build-stage

# Arbeitsverzeichnis im Container setzen
WORKDIR /app

# Abhängigkeiten kopieren und installieren (nutzt den Docker-Cache optimal)
COPY package*.json ./
RUN npm install

# Restlichen Quellcode kopieren und Vue-App bauen
COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM nginx:alpine AS production-stage

# Nginx-Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Die gebauten Dateien aus Stage 1 in den Nginx-Ordner kopieren
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Port 80 freigeben
EXPOSE 80

# Nginx starten
CMD ["nginx", "-g", "daemon off;"]