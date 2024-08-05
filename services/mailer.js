const nodemailer = require('nodemailer');

const dotenv = require('dotenv');
dotenv.config();
const user_ = process.env.GMAILER;
const pass_ = process.env.GAPPPASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: user_,
    pass: pass_
  }
});

function createMailOptions(dest_addr,tr){
return {
  from: user_,
  to: dest_addr,
  subject: `TransferConnect transaction result:${tr.ref_num}`,
  text: `Transaction initiated from ${tr.app_id} for ${tr.loyalty_id}, amount: ${tr.amount}, resulted in status code: ${tr.status}. Do not reply.`
};
}
function sendMailNotif(mailOptions){
transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
}

const Mailer = {createMailOptions,sendMailNotif};
module.exports = Mailer;