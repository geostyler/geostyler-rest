# GeoStyler REST

REST interface for GeoStyler to convert between various formats for styling of geographic data.

## Dev-Setup

### Run dev-server

```
git clone https://github.com/geostyler/geostyler-rest.git

cd geostyler-rest

bun install

bun run dev

Open http://localhost:8888/api-docs/ in a browser
```

### Run unit tests

```
cd /path/to/this/checkout

bun test
```

## Production setup

### Run server

```
cd /path/to/this/checkout

bun install

bun run src/index.ts

Open http://localhost:8888/api-docs/ in a browser
```

### Run with Docker

```
cd /path/to/this/checkout

docker build -t geostyler_rest_server .

docker run -e NODE_API_PORT=9999 -p 9999:9999 geostyler_rest_server

Open http://localhost:9999/api-docs/ in a browser
```

## <a name="funding"></a>Funding & financial sponsorship

Maintenance and further development of this code can be funded through the
[GeoStyler Open Collective](https://opencollective.com/geostyler). All contributions and
expenses can transparently be reviewed by anyone; you see what we use the donated money for.
Thank you for any financial support you give the GeoStyler project 💞
