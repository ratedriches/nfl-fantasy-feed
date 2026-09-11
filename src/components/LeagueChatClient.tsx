"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/leagueChat";

const NAME_STORAGE_KEY = "ratedRLeagueChatName";
const POLL_INTERVAL_MS = 15_000;

export default function LeagueChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [textDraft, setTextDraft] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAME_STORAGE_KEY);
      if (stored) setDisplayName(stored);
    } catch {
      // localStorage unavailable — sign-in prompt will just show every visit.
    }
  }, []);

  const load = useCallback(() => {
    return fetch("/api/league/chat")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = textDraft.trim();
    if (!text || sending) return;

    // First message: require a name, then remember it for next time.
    let author = displayName;
    if (!author) {
      const name = nameDraft.trim();
      if (!name) return;
      author = name;
      setDisplayName(name);
      try {
        localStorage.setItem(NAME_STORAGE_KEY, name);
      } catch {
        // Non-fatal — they'll just be asked again next visit.
      }
    }

    setSending(true);
    try {
      const res = await fetch("/api/league/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text }),
      });
      if (res.ok) {
        setTextDraft("");
        load();
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading chat...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-gray-300">Chat storage isn&apos;t configured yet.</p>
        <p className="mt-2 text-xs text-gray-500">
          Add <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_URL</code> and{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_TOKEN</code> to{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">.env.local</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  function handleLogOut() {
    setDisplayName(null);
    setNameDraft("");
    try {
      localStorage.removeItem(NAME_STORAGE_KEY);
    } catch {
      // Ignore — worst case the old name just reappears next visit.
    }
  }

  return (
    <div className="flex h-[70vh] flex-col">
      {displayName && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5">
          <span className="text-xs text-gray-400">
            Signed in as <span className="font-semibold text-white">{displayName}</span>
          </span>
          <button
            type="button"
            onClick={handleLogOut}
            className="rounded-md border border-gray-700 px-2 py-1 text-[11px] font-semibold text-gray-300 hover:bg-gray-800"
          >
            Log out
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-3">
        {error && <p className="text-center text-xs text-red-400">Couldn&apos;t refresh messages.</p>}
        {messages.length === 0 && !error && (
          <p className="py-10 text-center text-sm text-gray-500">No messages yet — say something first.</p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => {
            const isMe = !m.isBot && m.author === displayName;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-1.5 px-1">
                  <span className={`text-xs font-semibold ${m.isBot ? "text-emerald-400" : "text-gray-300"}`}>
                    {m.author}
                    {m.isBot && <span className="ml-1 text-[9px] font-normal text-emerald-600">BOT</span>}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <div
                  className={`mt-0.5 max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                    isMe
                      ? "bg-blue-600 text-white"
                      : m.isBot
                        ? "bg-emerald-500/10 text-emerald-100 border border-emerald-800/50"
                        : "bg-gray-800 text-gray-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex flex-col gap-2">
        {!displayName && (
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your name (shown on your messages)"
            maxLength={24}
            className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-600"
          />
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            placeholder={displayName ? `Message as ${displayName}...` : "Type your message..."}
            maxLength={500}
            className="flex-1 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-600"
          />
          <button
            type="submit"
            disabled={sending || !textDraft.trim() || (!displayName && !nameDraft.trim())}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
