import fs from "node:fs";
import path from "node:path";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getStoreEmailFrom, isStoreEmailFromFallback } from "@/lib/store";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  from?: string;
  idempotencyKey?: string;
}

export class EmailDeliveryError extends Error {
  readonly retryable = true;

  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function sendEmail({
  to,
  subject,
  react,
  from,
  idempotencyKey,
}: SendEmailOptions) {
  if (isDevelopment()) {
    await sendEmailDev({ to, subject, react, from });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new EmailDeliveryError(
      "Email delivery is not configured: RESEND_API_KEY is required outside development",
    );
  }

  await sendEmailResend({
    to,
    subject,
    react,
    from,
    idempotencyKey,
    resendApiKey,
  });
}

/**
 * Dev mode: render email to HTML, log summary to console,
 * and write the HTML file to .next/emails/ for browser preview.
 */
async function sendEmailDev({ to, subject, react }: SendEmailOptions) {
  const html = await render(react);

  // Write to .next/emails/ so it's gitignored and easy to find
  const dir = path.join(process.cwd(), ".next", "emails");
  fs.mkdirSync(dir, { recursive: true });

  const slug = subject.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const timestamp = Date.now();
  const filename = `${slug}-${timestamp}.html`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, html);

  console.log("\n╭──────────────────────────────────────────────");
  console.log(`│ 📧 Email Preview (dev mode — not sent)`);
  console.log("├──────────────────────────────────────────────");
  console.log(`│ To:      ${to}`);
  console.log(`│ Subject: ${subject}`);
  console.log(`│ Preview: file://${filepath}`);
  console.log("╰──────────────────────────────────────────────\n");
}

/**
 * Production: send via Resend API.
 */
async function sendEmailResend({
  to,
  subject,
  react,
  from,
  idempotencyKey,
  resendApiKey,
}: SendEmailOptions & { resendApiKey: string }) {
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);
  const fromAddress = from || getStoreEmailFrom();

  if (!from && isStoreEmailFromFallback()) {
    console.warn(
      "[email] EMAIL_FROM is not set — using fallback 'orders@example.com' which will likely be rejected by Resend",
    );
  }

  const { error } = await resend.emails.send(
    {
      from: fromAddress,
      to,
      subject,
      react,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) {
    console.error("[email] Failed to send:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
