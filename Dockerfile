# Etapa de build
FROM node:18-alpine AS build
WORKDIR /app

# Instalar dependencias del sistema para compilación nativa
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar archivos de configuración primero
COPY angular.json ./
COPY esbuild.config.js ./

# Copiar el resto de la aplicación
COPY . .

# Ejecutar el script de copia y build
RUN npm run build:prod

# Etapa de producción
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/dist/tu-app-frontend /usr/share/nginx/html

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80