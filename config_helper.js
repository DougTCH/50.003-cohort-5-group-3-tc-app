const fs = require('node:fs');
var app_config = JSON.parse(fs.readFileSync("./config.json"));

function get_app_config(test = false){
    if(!test){
        return JSON.parse(fs.readFileSync("./config.json"));
    }
    return app_config;
}

function set_config(key,object)
{
    app_config[key] = object;
}


module.exports = {get_app_config,set_config};