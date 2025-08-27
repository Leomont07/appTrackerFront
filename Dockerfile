# Dockerfile CORREGIDO
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Ejecutar build de producción directamente
RUN npx ng build --configuration production


FROM nginx:alpine

# Copiar los archivos construidos
COPY --from=build /app/dist/delivery-app/browser /usr/share/nginx/html

# Verificar que se copió correctamente
RUN echo "Contenido de nginx html:"
RUN ls -la /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80