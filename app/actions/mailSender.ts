"use server";

import { sendMail } from "@/lib/sendMail";

export async function contactAction(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const message = formData.get("message") as string;

  const mailText = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
  return await sendMail({
    to: process.env.FROM_EMAIL!,
    subject: "New Contact Form Submission",
    text: mailText,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message}</p>`,
  });
}
