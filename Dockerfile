FROM node:lts-alpine
LABEL maintainer="reports@geostyler.org"

COPY . .
RUN npm install

CMD [ "npm", "start" ]
