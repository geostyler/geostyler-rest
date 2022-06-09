/**
 * Main executable for GeoStyler REST server
 *
 * @author C. Mayer (meggsimum)
 */
const express = require('express');

const port = process.env.NODE_API_PORT || 8888;
const app = express();

app.use(function (req, res, next) {
  var data = '';
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    data += chunk;
  });

  req.on('end', function () {
    req.body = data;
    next();
  });
});

require('./route/style.route.js')(app);

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/spec.json');
// use the version declaration of the package.json in Swagger UI
const packageVersion = require('./package.json').version;
swaggerDocument.info.version = packageVersion;

const swaggerOptions = {
  // dirty CSS hack to inject logos into the Swagger UI
  customCss: `
    .swagger-ui .topbar { display: none }
    .information-container {border: 1px solid #fafafa}
    .information-container {
      background-image: url(https://geostyler.org/images/geostyler-logo-full.svg);
      background-repeat: no-repeat;
      background-position-x: right;
      background-size: 300px;
    }
    .info {
      background-image: url(https://meggsimum.de/wp-content/uploads/2018/05/meggsimum-logo-rgb-500-2.png);
      background-repeat: no-repeat;
      background-position: right;
      background-size: 300px;
    }
    `
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
// END Swagger

module.exports = app.listen(port, () =>
  console.log(`REST server listening on port ${port}!`)
);
