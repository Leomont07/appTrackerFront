# Etapa de construcción de Angular
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx ng build --configuration production

# Etapa de producción con Nginx
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa "build"
COPY --from=build /app/dist/delivery-app/browser /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check endpoint
RUN echo "healthy" > /usr/share/nginx/html/health

# Exponer puerto
EXPOSE 80

# Ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]