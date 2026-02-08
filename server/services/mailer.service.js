import { createTransport } from "nodemailer";

const { mailer: config } = useRuntimeConfig();

const transporter = createTransport(config);

function verify() {
    transporter.verify((error, success) => {
        if (error) return console.error(`Failed to verify transporter: ${error}`);
        console.log("✔ Transporter is ready to send emails");
    });
}

const queue = [];
let isSending = false;

function send(subject, message, to, attachments = []) {
    queue.push({ subject, message, to, attachments });
    if (!isSending) {
        isSending = true;
        sendNextMail();
    }
}

function sendNextMail() {
    const mail = queue.shift();
    if (!mail) {
        isSending = false;
        return;
    }
    const mailOptions = {
        from: config.auth.user,
        to: mail.to,
        subject: mail.subject,
        text: mail.message,
        html: mail.message,
        attachments: mail.attachments,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error(`Failed to send email: ${error}`);
        sendNextMail();
    });
}

export default { send, verify };
