# Etapa de build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package files y scripts
COPY package*.json ./
COPY scripts/ ./scripts/

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Ejecutar scripts para copiar imágenes y arreglar CSS
RUN npm run postinstall

# Copiar el resto de la aplicación
COPY . .

# Build de producción
RUN npm run build:prod

# Etapa de producción
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/dist/tu-app-frontend /usr/share/nginx/html

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80