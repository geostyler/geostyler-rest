# GeoStyler REST

REST interface for GeoStyler to convert between various formats for styling of geographic data.

Try it out in our live demo: https://rest.geostyler.org

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

## Run with OGC API styles support

You can run the API with support for OGC API styles (currently not a standard yet but with draft status). It will run under the /ogc endpoint.

Note that the OGC API styles is an API to manage and persist styles, so you'll also need a database. Currently only postgres is supported.

Activate it by setting the `OGC_API` environment variable to `true`. You'll also need to set the `DATABASE_URL` environment variable to an appropriate value, e.g. `postgres://postgres@gs-postgres:5432/ogc` as well as set the `OGC_USER` and `OGC_PASSWORD` to appropriate values.
Only authenticated requests (HTTP Basic) are allowed to modify data. Styles are stored using their native format at the point when they were inserted, but can be requested in any format GeoStyler supports.

### Compose setup

The docker compose setup includes a complete dev setup including an nginx, a postgres and the gs-rest service. It has the OGC API activated by default. If you just want to run the geostyler-rest API quickly without the OGC API, just run `bun run start` instead.

## <a name="funding"></a>Funding & financial sponsorship

Maintenance and further development of this code can be funded through the
[GeoStyler Open Collective](https://opencollective.com/geostyler). All contributions and
expenses can transparently be reviewed by anyone; you see what we use the donated money for.
Thank you for any financial support you give the GeoStyler project 💞
