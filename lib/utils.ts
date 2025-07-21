import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function sendTelegramNotification({
  fileName,
  uploader,
  url,
  comment,
}: {
  fileName: string;
  uploader: string;
  url?: string;
  comment?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = `✅ *New Resource Uploaded!*

*File:* ${fileName}
*By:* ${uploader}
${url ? `*Resource:* [Open File](${url})\n` : ""}

*Comment:*
${comment ? comment : "Nothing"}

➡️ *Take Action:* [Review Contribution](https://rvce-utility-bknd.vercel.app)`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}
