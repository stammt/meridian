FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN VITE_API_URL=VITE_API_URL_PLACEHOLDER npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["/bin/sh", "-c", "find /usr/share/nginx/html -type f -name '*.js' | xargs sed -i 's|VITE_API_URL_PLACEHOLDER|'\"$VITE_API_URL\"'|g' && nginx -g 'daemon off;'"]