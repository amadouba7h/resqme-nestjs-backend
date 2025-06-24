# Stage de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Build l'application
RUN npm run build

# Stage de production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier les fichiers buildés depuis le stage de build
COPY --from=builder /app/dist ./dist

# Copier les templates email qui ne sont pas dans dist
COPY --from=builder /app/src/notifications/templates ./dist/notifications/templates

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "dist/main"] 