# Dockerfile CORREGIDO
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# ¡USAR EL SCRIPT CORRECTO!
# RUN npm run build --configuration production  ← Esto no funciona
RUN npm run build:prod  # ← Usar este en su lugar

FROM nginx:alpine
COPY --from=build /app/dist/delivery-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80