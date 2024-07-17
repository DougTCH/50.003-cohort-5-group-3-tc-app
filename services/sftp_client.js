
const TransferConnectCrypt = require('./cryptography.js');
const prompt = require("prompt-sync")({ sigint: true });
const fs = require('node:fs');
//import { config } from 'node:process';
const params = require('../config_helper.js').get_app_config();
//import { param } from '../routes/transact.js';
let Client = require('ssh2-sftp-client');

class SFTPClient {
  constructor(params) {
    this.client = new Client();
    this.params = params;
    this.connected = false;
    this.tasks = 0;
  }

  async connect(options) {
    if(this.connected){
      return;
    }
    //console.log(`Connecting to ${options.host}:${options.port}`);
    try {
      await this.client.connect(options);
      this.connected = true;
      //console.log("Connected");
    } catch (err) {
      console.log('Failed to connect:', err);
    }
  }

  async disconnect() {
    while (this.tasks>0);
    if(!this.connected){
        //console.log('SFTP already disconnected');
    }
    await this.client.end();
    this.connected = false;
    //console.log("SFTP Client disconnect");
  }

  async listFiles(remoteDir, fileGlob) {
    //console.log(`Listing ${remoteDir} ...`);
    let fileObjects;
    try {
      fileObjects = await this.client.list(remoteDir, fileGlob);
    } catch (err) {
      console.log('Listing failed:', err);
    }

    const fileNames = [];

    for (const file of fileObjects) {
      if (file.type === 'd') {
        console.log(`${new Date(file.modifyTime).toISOString()} PRE ${file.name}`);
      } else {
        console.log(`${new Date(file.modifyTime).toISOString()} ${file.size} ${file.name}`);
      }

      fileNames.push(file.name);
    }

    return fileNames;
  }

  async uploadFile(localFile, remoteFile) {
    this.tasks +=1;
    //console.log(`Uploading ${localFile} to ${remoteFile} ...`);
    try {
      await this.client.put(localFile, remoteFile);
    } catch (err) {
      console.error('Uploading failed:', err);
    }finally{
    this.tasks-=1;
  }
  }

  async downloadFile(remoteFile, localFile) {
    this.task+=1
    //console.log(`Downloading ${remoteFile} to ${localFile} ...`);
    try {
      await this.client.get(remoteFile, localFile);
    } catch (err) {
      console.error('Downloading failed:', err);
    }finally{
      this.tasks-=1;
    }
  }

  async deleteFile(remoteFile) {
    this.tasks+=1;
    //console.log(`Deleting ${remoteFile}`);
    try {
      await this.client.delete(remoteFile);
    } catch (err) {
      console.error('Deleting failed:', err);
    }finally{
      this.tasks-=1;
    }
  }
}

var cipher,privatekey,fn;
var sftp_params = params["sftp"];
//console.log(sftp_params);
if(sftp_params.sftp_key){
  if(sftp_params.sftp_key=="prompt"){
    fn = prompt("SFTP Key File?:\n");
  }
  else{
    fn = sftp_params.sftp_key;
  }
  cipher = fs.readFileSync(fn,'utf-8');
  if(sftp_params.key_pass){
    if(sftp_params.key_pass=="prompt"){
      privatekey =  TransferConnectCrypt.decrypt(prompt.hide('Password?: '),cipher);
    }else{
      privatekey = TransferConnectCrypt.decrypt(sftp_params.key_pass,cipher);
    }
  }else{
    throw {error:"SFTP no Keys: Aborting"};
  }
}else{
  throw {error: "Bad SFTP Params"};
}

const parsed = { host:sftp_params.params.host, username:sftp_params.params.username,privateKey:privatekey,port:sftp_params.params.port};
const client = new SFTPClient(parsed);

module.exports = SFTPService = {Client: client,onSIGINT:async ()=>{await client.disconnect();}};
