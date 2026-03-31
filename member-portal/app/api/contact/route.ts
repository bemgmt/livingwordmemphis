import { NextResponse } from "next/server";
import { Resend } from "resend";

function isHoneypotClean(formData: FormData): boolean {
  const bot = formData.get("company");
  return !bot || String(bot).trim() === "";
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid form data." },
      { status: 400 },
    );
  }

  if (!isHoneypotClean(formData)) {
    return NextResponse.json({
      ok: true,
      message: "Thanks — we'll be in touch.",
    });
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, message: "Please fill in name, email, and message." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() || "onboarding@resend.dev";

  if (!apiKey || !to) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Contact form is not configured (set RESEND_API_KEY and CONTACT_TO_EMAIL).",
      },
      { status: 503 },
    );
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
    return NextResponse.json(
      {
        ok: false,
        message: "Could not send right now. Please try again or email us directly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Thanks — we received your message.",
  });
}
