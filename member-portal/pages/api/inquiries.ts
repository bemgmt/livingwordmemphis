import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

function isHoneypotClean(body: Record<string, unknown>): boolean {
  const bot = body.company;
  return !bot || String(bot).trim() === "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const body = req.body as Record<string, unknown>;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, message: "Invalid JSON body." });
  }

  if (!isHoneypotClean(body)) {
    return res.status(200).json({
      ok: true,
      message: "Thanks — we'll be in touch.",
    });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !message) {
    return res.status(400).json({
      ok: false,
      message: "Please fill in name, email, and message.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      ok: false,
      message: "Please enter a valid email address.",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() || "onboarding@resend.dev";

  if (!apiKey || !to) {
    return res.status(503).json({
      ok: false,
      message:
        "Contact form is not configured (set RESEND_API_KEY and CONTACT_TO_EMAIL).",
    });
  }

  const resend = new Resend(apiKey);
  const subjectLine = subject
    ? `[${subject}] Message from ${name}`
    : `Message from ${name}`;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    subject ? `Subject: ${subject}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: subjectLine,
    text,
  });

  if (error) {
    return res.status(502).json({
      ok: false,
      message:
        "Could not send right now. Please try again or email us directly.",
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Thanks — we received your message.",
  });
}
