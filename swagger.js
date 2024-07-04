const options = {
  openapi: "3.0.0",
  language: "en-US",
  disableLogs: false,
  autoHeaders: false,
  autoQuery: true,
  autoBody: true,
};
const generateSwagger = require("swagger-autogen")(options);

const swaggerDocument = {
  info: {
    version: "1.0.0",
    title: "TransferConnect API",
    description: "API for managing process points accrual",
    contact: {
      name: "API Support",
      email: "N/A",
    },
  },
  host: "localhost:3000",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags: [
    {
      name: "Transfer Connect API",
      description: "Web API",
    },
  ],
  components: {
    securitySchemes:{
        bearerAuth: {
            type: 'http',
            scheme: 'bearer'
        }
    }
  },
};
const swaggerFile= "./docs/swagger.json";
const apiRouteFile= ["./app.js"];
generateSwagger(swaggerFile, apiRouteFile, swaggerDocument);