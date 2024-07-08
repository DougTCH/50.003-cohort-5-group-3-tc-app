const {
    createCipheriv,
    scryptSync,
    createDecipheriv,
    randomFillSync,
  } = require('node:crypto');
  const TextDecoder = require('util').TextDecoder;
  const TextEncoder = require('util').TextEncoder;
  const { Buffer } = require('node:buffer');
  const algorithm = 'aes-256-cbc';
  const salt = 'TRANSFER_CONN';
//   const password = 'Password used to generate key';
  
  // First, we'll generate the key. The key length is dependent on the algorithm.
  // In this case for aes192, it is 24 bytes (192 bits).
function encrypt(password,clear_text,iv){
    try{
        const key = scryptSync(password, salt, 32)
        //let buff = new Uint8Array(16)
        // Then, we'll generate a random initialization vector
        let encoder = new TextEncoder();
        
        const cipher = createCipheriv(algorithm, key, encoder.encode(iv));

        let encrypted = cipher.update(clear_text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        console.log(encrypted);
        encrypted+=iv
        console.log(encrypted);
        return encrypted;
    
    }catch(err){
        console.error(err);
    }

}



function decrypt(password,cipher){
    // Key length is dependent on the algorithm. In this case for aes192, it is
    // 24 bytes (192 bits).
    // Use the async `crypto.scrypt()` instead.
    const key = scryptSync(password, salt, 32);
    const decipher = createDecipheriv(algorithm, key, cipher.substring(cipher.length-16));
    cipher = cipher.substring(0,cipher.length-16);
    return decipher.update(cipher,'hex','utf-8')+decipher.final('utf-8');
}
const TransferConnectCrypt = {encrypt:encrypt,decrypt:decrypt}
module.exports = TransferConnectCrypt;