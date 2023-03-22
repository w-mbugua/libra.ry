import nodemailer from 'nodemailer';

async function sendMail(email: string, tokenUrl: string) {
  let testAccount = await nodemailer.createTestAccount();
  console.log({ testAccount });

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASS, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Libra.ry 👻" <foo@example.com>', // sender address
    to: email, // list of receivers
    subject: 'Password Reset',
    html: tokenUrl, // html body
  });

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

export default sendMail;
