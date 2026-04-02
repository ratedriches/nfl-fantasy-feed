import type { Tweet } from "@/data/mockTweets";

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

export default function TweetCard({
  tweet,
  teamColor,
}: {
  tweet: Tweet;
  teamColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-3.5">
      {/* Author row */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: teamColor }}
          >
            {tweet.authorName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{tweet.authorName}</p>
            <p className="text-xs text-gray-500 truncate">
              @{tweet.authorHandle} · {tweet.authorOutlet}
            </p>
          </div>
        </div>
        <span className="ml-2 shrink-0 text-xs text-gray-600">{timeAgo(tweet.timestamp)}</span>
      </div>

      {/* Tweet content */}
      <p className="text-sm leading-relaxed text-gray-200">{tweet.content}</p>

      {/* Engagement row */}
      <div className="mt-2.5 flex gap-4 text-xs text-gray-600">
        <span>💬 {tweet.replies.toLocaleString()}</span>
        <span>🔁 {tweet.retweets.toLocaleString()}</span>
        <span>❤️ {tweet.likes.toLocaleString()}</span>
      </div>
    </div>
  );
}
