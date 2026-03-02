FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 8080
CMD ["/bin/sh", "-c", "echo \"window.__ENV__={VITE_API_URL:'$VITE_API_URL'}\" > /app/dist/env.js && serve -s dist -l 8080 --single"]
