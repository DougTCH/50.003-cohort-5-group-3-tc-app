const fs = require('node:fs');
const app_config = JSON.parse(fs.readFileSync("./config.json"));
module.exports = app_config;