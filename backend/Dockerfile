FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN node ./node_modules/@nestjs/cli/bin/nest.js build

EXPOSE 3001

CMD ["node", "dist/main"]
