FROM node:lts-alpine
LABEL maintainer="info@meggsimum.de"

COPY . .
RUN npm install

CMD [ "npm", "start" ]
