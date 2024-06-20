import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { html } from '@elysiajs/html'
import { transFormApi, transform } from "./routes/api";
import loggisch from 'loggisch';
import { versions } from "./routes/info";

loggisch.setLogLevel('trace');

const port = process.env.NODE_API_PORT || 8888;

const app = new Elysia()
  .use(swagger({
    path: "/api-docs",
    exclude: ["/api-docs", "/api-docs/json"],
    documentation: {
      info: {
        title: 'GeoStyler Rest API',
        version: '1.0.0',
        description: 'This is a REST API for the [GeoStyler](https://github.com/geostyler/geostyler) library.'
      }
    }
  }))
  .group("/info", (app) => app
    .use(html())
    .get("/versions", versions)
  )
  .group("/api", (app) => app
    .post("/transform", transform, transFormApi)
  )
  .listen(port);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

export default app;
