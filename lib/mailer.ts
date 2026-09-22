import nodemailer, { type Transporter } from "nodemailer";

// Singleton transporter from the SMTP_* env set (see .env.example).
// Created lazily so importing this module never throws when mail is
// unconfigured (e.g. unit contexts) — sendOtpEmail validates first.
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } =
    process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: SMTP_SECURE === "true",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    }
    return transporter;
  }
  // Gmail shorthand (app password): MY_EMAIL + EMAIL_PASSWORD.
  const { MY_EMAIL, EMAIL_PASSWORD } = process.env;
  if (MY_EMAIL && EMAIL_PASSWORD) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: MY_EMAIL, pass: EMAIL_PASSWORD },
      });
    }
    return transporter;
  }
  return null;
}

export async function sendOtpEmail(
  to: string,
  otp: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const transport = getTransporter();
  if (!transport)
    return { ok: false, error: "Mail is not configured on this server." };
  const from =
    process.env.MAIL_FROM ??
    (process.env.MY_EMAIL
      ? `OPD Clinic <${process.env.MY_EMAIL}>`
      : "OPD Clinic <no-reply@localhost>");
  try {
    await transport.sendMail({
      from,
      to,
      subject: "Your password reset code",
      text: `Your OPD Clinic password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      html: `<p>Your OPD Clinic password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, ignore this email.</p>`,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send the email. Try again later." };
  }
}
