// app.js
const express = require('express');
//const { specs, swaggerUi } = require('./swagger');
const app = express();
const port = 3000;
const schema = require('./models/schema.js');
const swaggerUIPath= require("swagger-ui-express");
const swaggerjsonFilePath = require("./docs/swagger.json");
const SFTPService = require('./services/sftp_client.js');
const db = require('./services/db_adaptor.js');

schema();

app.use(express.json());
app.use("/api-docs", swaggerUIPath.serve, swaggerUIPath.setup(swaggerjsonFilePath));
app.use("/transact",require("./routes/transact"));
app.use("/auth",require("./routes/auth"));
app.use("/b2b",require("./routes/b2b"));
app.use("/info",require("./routes/info"));
app.get('/', (req, res) => {
  res.status(401).send("API");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

async function closeconnections(){
  //await SFTPService.onSIGINT();
  db.run(()=>{
  db.close((err)=>{
    if(err)console.error(err);
    else console.log('DB CLOSED');
  });});
}

process.on('SIGINT',closeconnections);
process.on('SIGTERM',closeconnections);