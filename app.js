// app.js
const express = require('express');
//const { specs, swaggerUi } = require('./swagger');
const app = express();
const schema = require('./models/schema.js');
const swaggerUIPath= require("swagger-ui-express");
const swaggerjsonFilePath = require("./docs/swagger.json");
const SFTPService = require('./services/sftp_client.js');
const db = require('./services/db_adaptor.js');
const schedule = require('node-schedule');
const params = require("./config_helper.js");
const port =  params["network"].port||3000;
const submit_accrual_job = require('./jobs/submitaccrual.js');

const rule_submit = new schedule.RecurrenceRule();
rule_submit.hour = 1; //1 am recurrence

// const rule_acquire = new schedule.RecurrenceRule();
// rule_acquire.hour = 3; //1 am recurrence

const job_s = schedule.scheduleJob(rule_submit, function(){
  submit_accrual_job();
});

// const job_a = schedule.scheduleJob(rule_acquire, function(){
//   require('./jobs/gethandback.js').get_handback_job();
// });



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

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

async function closeconnections(){
  schedule.gracefulShutdown();
  await SFTPService.onSIGINT();
  db.run(()=>{
  db.close((err)=>{
    if(err)console.error(err);
    else console.log('DB CLOSED');
  });});
}

process.on('SIGINT',closeconnections);
process.on('SIGTERM',closeconnections);

module.exports = {app,server,closeconnections};