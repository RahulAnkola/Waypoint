import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let name = "", email = "", message = "";
  let attachments: { filename: string; content: Buffer }[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    name = (form.get("name") as string) ?? "";
    email = (form.get("email") as string) ?? "";
    message = (form.get("message") as string) ?? "";
    const file = form.get("attachment") as File | null;
    if (file && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      attachments = [{ filename: file.name, content: buf }];
    }
  } else {
    const body = await req.json();
    name = body.name ?? "";
    email = body.email ?? "";
    message = body.message ?? "";
  }

  if (!name.trim() || !email.trim() || !message.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Waypoint Contact <onboarding@resend.dev>",
    to: process.env.CONTACT_EMAIL!,
    replyTo: email,
    subject: `Waypoint message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#c25b3a">New message from Waypoint</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #c25b3a">
          <p style="margin:0;white-space:pre-wrap">${message}</p>
        </div>
        ${attachments.length ? `<p style="margin-top:12px;font-size:13px;color:#6b7280">📎 ${attachments.length} attachment(s) included.</p>` : ""}
      </div>
    `,
    ...(attachments.length ? { attachments } : {}),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
