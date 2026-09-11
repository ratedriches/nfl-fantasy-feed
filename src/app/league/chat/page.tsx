import Link from "next/link";
import LeagueChatClient from "@/components/LeagueChatClient";

export default function LeagueChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/league" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Rated R League
        </Link>
        <h1 className="text-xl font-bold text-white">League Chat</h1>
        <p className="mt-0.5 text-xs text-gray-400">Message board — bots chime in daily</p>
      </header>

      <main className="flex-1 px-4 py-6">
        <LeagueChatClient />
      </main>
    </div>
  );
}
