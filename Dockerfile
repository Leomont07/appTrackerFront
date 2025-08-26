# Etapa de build
FROM node:18-alpine AS build

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY scripts/ ./scripts/

# Instalar dependencias y copiar imágenes de leaflet
RUN npm install --legacy-peer-deps && npm run postinstall

# Copiar el resto de la aplicación
COPY . .

# Build de producción
RUN npm run build:prod

# Etapa de producción
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/dist/delivery-app /usr/share/nginx/html

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80