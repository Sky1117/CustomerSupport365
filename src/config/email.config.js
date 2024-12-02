const nodemailer = require("nodemailer");
const AppSetting = require("../api/models/appSetting.model"); // Make sure the path is correct

// Function to create a transporter using SMTP settings from the database
const createTransporter = async () => {
  const appSetting = await AppSetting.findOne({ isActive: true });

  if (!appSetting) {
    throw new Error("Active SMTP settings not found");
  }

  return nodemailer.createTransport({
    host: appSetting.smtpServer,
    port: appSetting.smtpPort,
    secure: appSetting.secure, // true for 465, false for other ports
    auth: appSetting.authentication
      ? {
          user: appSetting.username,
          pass: appSetting.password,
        }
      : undefined,
  });
};

// Function to send an email
async function sendEmail(to, subject, html) {
  const appSetting = await AppSetting.findOne({ isActive: true });
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: appSetting.senderEmail,
      to,
      subject,
      text: "Text Here!",
      html,
    });

    if (info?.messageId) {
      return "email sent";
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Function to send a verification email
async function sendVerifyEmail(name, email, id) {
  const appSetting = await AppSetting.findOne({ isActive: true });
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: appSetting.senderEmail,
      to: email,
      subject: "for Verification mail",
      html: `<p>Hi ${name},</p>
      <p>Please click here to <a href="http://localhost:3000/verify?id=${id}">verify your email</a>.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email has been sent:", info.response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

// Function to send a status change email
const sendStatusChangeEmail = async (ticket) => {
  const appSetting = await AppSetting.findOne({ isActive: true });
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: appSetting.senderEmail,
      to: ticket.email,
      subject: `Ticket ${ticket._id} status updated to ${ticket.status}`,
      text: `Dear ${ticket.fullName}, 
  
  Your ticket ${ticket._id} has been updated to status ${ticket.status}. Please login to your account to view the updated ticket.
  
  Best regards,
  Your Support Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${ticket.email}`);
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending status change email:", error);
  }
};

// Function to send a template email
async function sendTemplateEmail({ to, subject, html }) {
  const appSetting = await AppSetting.findOne({ isActive: true });
  console.log("this is your appsetting", appSetting);
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Your Company Name" <${appSetting.senderEmail}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending template email:", error);
    throw error;
  }
}

// Function to send priority expiration email
const sendPriorityExpireEmail = async (to, subject, text) => {
  const appSetting = await AppSetting.findOne({ isActive: true });
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: appSetting.senderEmail,
      to,
      subject,
      text,
    });

    console.log("Priority expiration email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending priority expiration email:", error);
    throw error;
  }
};

// Function to send admin reply email
const sendAdminReplyEmail = async (to, subject, text) => {
  const appSetting = await AppSetting.findOne({ isActive: true });
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: appSetting.senderEmail,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Admin reply email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending admin reply email:", error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendVerifyEmail,
  sendStatusChangeEmail,
  sendTemplateEmail,
  sendPriorityExpireEmail,
  sendAdminReplyEmail,
};
