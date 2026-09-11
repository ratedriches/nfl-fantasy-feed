"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "@/lib/espnFantasy";

const TYPE_LABELS: Record<string, string> = {
  WAIVER: "Waiver",
  FREEAGENT: "Free Agent",
  TRADE: "Trade",
};

const TYPE_COLORS: Record<string, string> = {
  WAIVER: "bg-blue-500/15 text-blue-400",
  FREEAGENT: "bg-gray-500/15 text-gray-300",
  TRADE: "bg-purple-500/15 text-purple-400",
};

export default function LeagueTransactionsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/league/transactions")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading transactions...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-gray-300">ESPN league credentials aren&apos;t set up yet.</p>
        <p className="mt-2 text-xs text-gray-500">
          Add <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_LEAGUE_ID</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_SEASON</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_S2</code> and{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_SWID</code> to{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">.env.local</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load transactions.</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No waiver, free agent, or trade activity yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {transactions.map((tx) => {
        const adds = tx.items.filter((i) => i.type === "ADD" || i.type === "TRADED");
        const drops = tx.items.filter((i) => i.type === "DROP");
        return (
          <div key={tx.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[tx.type] ?? "bg-gray-700 text-gray-300"}`}
              >
                {TYPE_LABELS[tx.type] ?? tx.type}
              </span>
              <span className="text-sm font-semibold text-white">{tx.teamName}</span>
              {tx.bidAmount > 0 && <span className="text-xs text-gray-500">${tx.bidAmount} FAAB</span>}
              {tx.status !== "EXECUTED" && (
                <span className="text-xs text-red-400">{tx.status.replace(/_/g, " ").toLowerCase()}</span>
              )}
              <span className="ml-auto text-[11px] text-gray-600">
                {tx.date ? new Date(tx.date).toLocaleDateString() : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              {adds.map((item, i) => (
                <div key={`add-${i}`} className="text-emerald-400">
                  + {item.playerName}
                  {item.playerPosition ? ` (${item.playerPosition})` : ""}
                </div>
              ))}
              {drops.map((item, i) => (
                <div key={`drop-${i}`} className="text-red-400">
                  − {item.playerName}
                  {item.playerPosition ? ` (${item.playerPosition})` : ""}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
