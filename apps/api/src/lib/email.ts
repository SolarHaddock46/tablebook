import nodemailer from "nodemailer";
import type { Locale } from "@tablebook/shared";
import { getBrandName } from "@tablebook/shared";
import { getReviewReminderOpenUrl } from "@/lib/review-reminder-links";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type MailTransportConfig = {
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  auth: { user: string; pass: string };
  tls?: { rejectUnauthorized: boolean };
};

function normalizeGmailAppPassword(value: string) {
  return value.replace(/\s/g, "");
}

function getGmailConfig(): MailTransportConfig | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    return null;
  }
  // Use 'service: gmail' shorthand for built-in Gmail settings
  // tls.rejectUnauthorized:false helps with some network environments
  return {
    service: "gmail",
    auth: { user, pass: normalizeGmailAppPassword(pass) },
    tls: { rejectUnauthorized: false }
  };
}

function getSmtpConfig(): MailTransportConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !port || !user || !pass) {
    return null;
  }
  return {
    host,
    port: Number(port),
    secure: Number(port) === Constants.SmtpTlsPort,
    auth: { user, pass }
  };
}

function getMailTransportConfig(): MailTransportConfig | null {
  return getGmailConfig() ?? getSmtpConfig();
}

function getFromAddress() {
  const gmailUser = process.env.GMAIL_USER?.trim();
  if (gmailUser && process.env.GMAIL_APP_PASSWORD?.trim()) {
    return `${getBrandName("ru")} <${gmailUser}>`;
  }
  return process.env.SMTP_FROM ?? Constants.DefaultFrom;
}

function getAppUrl() {
  return process.env.APP_URL ?? "http://localhost:8081";
}

async function sendEmail(input: SendEmailInput) {
  const transport = getMailTransportConfig();
  if (!transport) {
    process.stdout.write(
      `[email] (console fallback — set GMAIL_USER + GMAIL_APP_PASSWORD in .env.local)\nTo: ${input.to}\nSubject: ${input.subject}\n${input.text}\n\n`
    );
    return;
  }

  try {
    const mailer = nodemailer.createTransport(transport);
    const info = await mailer.sendMail({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    });
    process.stdout.write(`[email] sent to ${input.to} (id: ${info.messageId ?? "n/a"})\n`);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    process.stderr.write(`[email] FAILED to ${input.to}: ${error.message}\n`);
    throw error;
  }
}

function verificationCopy(locale: Locale, verifyUrl: string) {
  if (locale === "en") {
    return {
      subject: "Confirm your TableBook email",
      text: `Confirm your email by opening this link:\n\n${verifyUrl}\n\nThe link expires in 24 hours.`,
      html: `<p>Confirm your email by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>The link expires in 24 hours.</p>`
    };
  }
  const brand = getBrandName("ru");
  return {
    subject: `Подтвердите email в ${brand}`,
    text: `Подтвердите email, перейдя по ссылке:\n\n${verifyUrl}\n\nСсылка действует 24 часа.`,
    html: `<p>Подтвердите email, перейдя по ссылке:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Ссылка действует 24 часа.</p>`
  };
}

function passwordResetCopy(locale: Locale, resetUrl: string) {
  if (locale === "en") {
    return {
      subject: "Reset your TableBook password",
      text: `Reset your password by opening this link:\n\n${resetUrl}\n\nThe link expires in 1 hour.`,
      html: `<p>Reset your password by opening this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>The link expires in 1 hour.</p>`
    };
  }
  const brand = getBrandName("ru");
  return {
    subject: `Сброс пароля ${brand}`,
    text: `Сбросьте пароль, перейдя по ссылке:\n\n${resetUrl}\n\nСсылка действует 1 час.`,
    html: `<p>Сбросьте пароль, перейдя по ссылке:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ссылка действует 1 час.</p>`
  };
}

export async function sendVerificationEmail(input: {
  email: string;
  token: string;
  locale: Locale;
}) {
  const verifyUrl = `${getAppUrl()}/verify-email/${input.token}`;
  const copy = verificationCopy(input.locale, verifyUrl);
  await sendEmail({
    to: input.email,
    subject: copy.subject,
    text: copy.text,
    html: copy.html
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  token: string;
  locale: Locale;
}) {
  const resetUrl = `${getAppUrl()}/reset-password?token=${input.token}`;
  const copy = passwordResetCopy(input.locale, resetUrl);
  await sendEmail({
    to: input.email,
    subject: copy.subject,
    text: copy.text,
    html: copy.html
  });
}

function reviewReminderCopy(
  locale: Locale,
  input: { reviewUrl: string; restaurantName: string }
) {
  if (locale === "en") {
    return {
      subject: `How was your visit to ${input.restaurantName}?`,
      text: `Thanks for visiting ${input.restaurantName}!\n\nLeave a review:\n${input.reviewUrl}\n\nThe link is valid for 14 days.`,
      html: `<p>Thanks for visiting <strong>${input.restaurantName}</strong>!</p><p><a href="${input.reviewUrl}">Leave a review</a></p><p>The link is valid for 14 days.</p>`
    };
  }
  return {
    subject: `Как вам понравился визит в ${input.restaurantName}?`,
    text: `Спасибо за визит в ${input.restaurantName}!\n\nОставьте отзыв:\n${input.reviewUrl}\n\nСсылка действует 14 дней.`,
    html: `<p>Спасибо за визит в <strong>${input.restaurantName}</strong>!</p><p><a href="${input.reviewUrl}">Оставить отзыв</a></p><p>Ссылка действует 14 дней.</p>`
  };
}

export async function sendReviewReminderEmail(input: {
  email: string;
  token: string;
  locale: Locale;
  restaurantName: string;
}) {
  const reviewUrl = getReviewReminderOpenUrl(input.token);
  const copy = reviewReminderCopy(input.locale, {
    reviewUrl,
    restaurantName: input.restaurantName
  });
  await sendEmail({
    to: input.email,
    subject: copy.subject,
    text: copy.text,
    html: copy.html
  });
}

const Constants = {
  DefaultFrom: "ЗаСтолом <noreply@tablebook.app>",
  GmailHost: "smtp.gmail.com",
  GmailPort: 587,
  SmtpTlsPort: 465
} as const;