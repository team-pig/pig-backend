const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_ID,
		pass: process.env.MAIL_PASSWORD
  },
})

module.exports = transport