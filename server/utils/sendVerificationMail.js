const { createMailTransporter } = require("./createMailTransporter");

const sendVerificationMail = (user) => {
  const transporter = createMailTransporter();

  // HTML email template
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        h1 {
          color: #333;
        }
        p {
          color: #666;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007BFF;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verify Your Email Address</h1>
        <p>Hello ${user.name},</p>
        <p>Thank you for signing up for our News App. Please click the button below to verify your email address:</p>
        <a class="button" href="http://localhost:3000/verify-email/${user.emailToken}">Verify Your Email</a>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: '"News App" <abhishekerugadindla@gmail.com>',
    to: user.email,
    subject: "Verify your email",
    html: emailTemplate,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Verification email sent");
    }
  });
};

module.exports = { sendVerificationMail };
