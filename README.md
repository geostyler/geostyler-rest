# GeoStyler REST

REST interface for GeoStyler to convert between various formats for styling of geographic data.

## Dev-Setup

### Run dev-server

```
git clone https://github.com/geostyler/geostyler-rest.git

cd geostyler-rest

npm install

npm run start-dev
```

### Run unit tests

```
cd /path/to/this/checkout

npm run test
```

## Production setup

### Run server

```
cd /path/to/this/checkout

npm start
```

### Run with Docker

```
cd /path/to/this/checkout

docker build -t geostyler_rest_server .

docker run -e NODE_API_PORT=9999 -p 9999:9999 geostyler_rest_server
```
