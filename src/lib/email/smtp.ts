import nodemailer from "nodemailer";
import { z } from "zod";
import type { EmailProvider } from "@/modules/identity/email-provider";
import { authText } from "@/modules/identity/auth-messages";

const smtpSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z
    .string()
    .max(400)
    .refine((value) => !/[\r\n]/.test(value))
    .transform((value, context) => {
      const named = /^([^<>\r\n]{1,120})\s*<([^<>\r\n]+)>$/.exec(value);
      const address = z
        .string()
        .trim()
        .email()
        .max(254)
        .safeParse(named ? named[2] : value);
      if (!address.success) {
        context.addIssue({ code: "custom", message: "Invalid SMTP sender" });
        return z.NEVER;
      }
      return { name: named?.[1].trim(), address: address.data };
    }),
});

export function createEmailProvider(): EmailProvider | null {
  const result = smtpSchema.safeParse(process.env);
  if (!result.success) return null;
  const env = result.data;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return {
    async sendInvitation({ email, url, locale }) {
      const result = await transport.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: authText(locale, "invitation"),
        text: `${authText(locale, "invitedEmail")}\n\n${url}\n`,
      });
      if (!result.accepted?.length || result.rejected?.length)
        throw new Error("Invitation delivery failed");
    },
  };
}
