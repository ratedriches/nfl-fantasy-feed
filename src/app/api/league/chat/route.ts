import { getMessages, isChatConfigured, postMessage } from "@/lib/leagueChat";

export async function GET() {
  if (!isChatConfigured()) {
    return Response.json({ configured: false, messages: [] });
  }
  const messages = await getMessages(150);
  return Response.json({ configured: true, messages });
}

export async function POST(req: Request) {
  if (!isChatConfigured()) {
    return Response.json({ configured: false, error: "Chat isn't configured yet." }, { status: 503 });
  }

  let body: { author?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.author !== "string" || typeof body.text !== "string") {
    return Response.json({ error: "author and text are required." }, { status: 400 });
  }
  if (!body.author.trim() || !body.text.trim()) {
    return Response.json({ error: "author and text cannot be empty." }, { status: 400 });
  }

  const message = await postMessage({ author: body.author, text: body.text, isBot: false });
  if (!message) {
    return Response.json({ error: "Failed to post message." }, { status: 500 });
  }

  return Response.json({ message });
}
