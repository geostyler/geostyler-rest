/* Released under the BSD 2-Clause License
 *
 * Copyright © 2020-present, meggsimum (Christian Mayer) and GeoStyler contributors
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Main executable for GeoStyler REST server
 */
const express = require('express');

const port = process.env.NODE_API_PORT || 8888;
const rootPath = process.env.GS_REST_ROOT_PATH || '/geostyler-rest';
const app = express();

app.use(function (req, res, next) {
  let data = '';
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
    `,
  customCssUrl: `${rootPath}/static/swagger-ui-custom.css`,
  customJs: `${rootPath}/static/swagger-ui-custom.js`
};

app.use(`${rootPath}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
// END Swagger

// serve files in the static folder
app.use(`${rootPath}/static`, express.static('static'));

// ensure to forward to Swagger UI when root folder is accessed
app.get(rootPath, (req, res) => {
  res.redirect(`${rootPath}/api-docs`);
});

module.exports = app.listen(port, () =>
  console.log(`REST server listening on port ${port}!`)
);
