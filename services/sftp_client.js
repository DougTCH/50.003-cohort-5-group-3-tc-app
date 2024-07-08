// sftp.js
//
// Use this sample code to connect to your SFTP To Go server and run some file operations using Node.js.
//
// 1) Paste this code into a new file (sftp.js)
//
// 2) Install dependencies
//   npm install ssh2-sftp-client@^8.0.0
//
// 3) Run the script
//   node sftp.js
// 
// Compatible with Node.js >= v12
// Using ssh2-sftp-client v8.0.0
const TransferConnectCrypt = require('./cryptography.js');
const prompt = require("prompt-sync")({ sigint: true });
const fs = require('node:fs');

let Client = require('ssh2-sftp-client');

class SFTPClient {
  constructor(params) {
    this.client = new Client();
    this.params = params;
    this.connected = false;
  }

  async connect(options) {
    console.log(`Connecting to ${options.host}:${options.port}`);
    try {
      await this.client.connect(options);
      this.connected = true;
    } catch (err) {
      console.log('Failed to connect:', err);
    }
  }

  async disconnect() {
    if(!this.connected){
        console.error('SFTP already disconnected');
    }
    await this.client.end();
    this.connected = false;
  }

  async listFiles(remoteDir, fileGlob) {
    console.log(`Listing ${remoteDir} ...`);
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
    //console.log(`Uploading ${localFile} to ${remoteFile} ...`);
    try {
      await this.client.put(localFile, remoteFile);
    } catch (err) {
      console.error('Uploading failed:', err);
    }
  }

  async downloadFile(remoteFile, localFile) {
    console.log(`Downloading ${remoteFile} to ${localFile} ...`);
    try {
      await this.client.get(remoteFile, localFile);
    } catch (err) {
      console.error('Downloading failed:', err);
    }
  }

  async deleteFile(remoteFile) {
    console.log(`Deleting ${remoteFile}`);
    try {
      await this.client.delete(remoteFile);
    } catch (err) {
      console.error('Deleting failed:', err);
    }
  }
}

var fn = prompt('Filename: ');
var pw = prompt.hide('Password?: ');

var cipher = fs.readFileSync(fn,'utf-8');
var privatekey = TransferConnectCrypt.decrypt(pw,cipher);
//console.log(privatekey);
pw = null;
fn = null;

const parsed = { host:'kaligo.files.com', username:'c5g3',privateKey:privatekey,port:22};
const client = new SFTPClient(parsed);
// await client.connect(parsed);
// await client.listFiles("/sutd_project_2024/c5g3/Accrual");
// await client.listFiles("/sutd_project_2024/c5g3/Handback");
// await client.disconnect();


module.exports = SFTPService = {Client: client,onSIGINT:async ()=>{await client.disconnect();}};
