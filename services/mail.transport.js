const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_IDD,
		pass: process.env.MAIL_PASSWORDD
  },
})

module.exports = transport