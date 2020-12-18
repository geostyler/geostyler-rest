

const path = require('path');
console.log(path.join(__dirname, '/route/style.route.js'));

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'GeoStyler REST API',
      version: '0.0.1',
      description:
        'REST interface for GeoStyler to convert between various formats for styling of geographic data.',
      license: {
        name: 'BSD-2-Clause'
      },
      contact: {
        name: 'meggsimum - Christian Mayer',
        url: 'https://meggsimum.de',
        email: 'info@meggsimum.de'
      }
    },
    servers: []
  },
  apis: [
    // './index.js',
    // './model/place.model.js',
    // path.join(__dirname, '/route/style.route.js')
    // ,
    './route/style.route.js'
  ]
};

module.exports = swaggerOptions;
