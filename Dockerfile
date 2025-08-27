# Dockerfile CORREGIDO
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build --configuration production

FROM nginx:alpine

# ¡CORREGIR ESTA LÍNEA!
# La ruta correcta es: /app/dist/delivery-app/browser/
COPY --from=build /app/dist/delivery-app/browser /usr/share/nginx/html

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verificar que se copió correctamente (opcional para debug)
RUN ls -la /usr/share/nginx/html/

EXPOSE 80

