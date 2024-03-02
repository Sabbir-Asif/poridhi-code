FROM node:alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 6000
ENV PORT=6000
CMD [ "node","app-two.js" ]