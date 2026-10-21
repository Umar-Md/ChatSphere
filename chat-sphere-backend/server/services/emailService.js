const nodemailer = require('nodemailer');

exports.sendRegistrationOtp = async (email, otp) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
    }
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT || 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 10000,
        socketTimeout: 15000,
    });
    await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: email,
        subject: 'Verify your ChatSphere email',
        text: `Your ChatSphere verification code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    });
};
