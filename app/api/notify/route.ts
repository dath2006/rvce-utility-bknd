import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { fileName, uploader, url } = await req.json();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId)
    return NextResponse.json(
      { error: "Missing token/chatId" },
      { status: 500 }
    );

  const text = `✅ *New Resource Uploaded*\n• *File:* ${fileName}\n• *By:* ${uploader}\n${
    url ? `• [Open File](${url})` : ""
  }`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });

  const json = await res.json();
  return res.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: json }, { status: 500 });
}
