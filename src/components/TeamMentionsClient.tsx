"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/leagueChat";

export default function TeamMentionsClient({ teamId }: { teamId: number }) {
  const [mentions, setMentions] = useState<ChatMessage[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/league/team/${teamId}/mentions`)
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setMentions(Array.isArray(data.mentions) ? data.mentions : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading mentions...</p>
      </div>
    );
  }

  if (!configured || error) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load mentions.</p>
      </div>
    );
  }

  if (mentions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No mentions in the chat yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {mentions.map((m) => (
        <div key={m.id} className="rounded-xl border border-gray-800 bg-gray-900 p-3">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xs font-semibold ${m.isBot ? "text-emerald-400" : "text-gray-300"}`}>
              {m.author}
              {m.isBot && <span className="ml-1 text-[9px] font-normal text-emerald-600">BOT</span>}
            </span>
            <span className="text-[10px] text-gray-600">
              {new Date(m.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-200">{m.text}</p>
        </div>
      ))}
    </div>
  );
}
