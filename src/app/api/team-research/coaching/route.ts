const SHEET_ID = "1KPfVL7EWIClQqvLGtg-g6CN49O32n60LBhmvxBwklEg";
const SHEET_NAME = "Coaching Staff";

function parseFirstTwoCols(line: string): [string, string] {
  const match = line.match(/^"((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)"/);
  if (match) return [match[1], match[2]];
  const parts = line.split(",");
  return [
    parts[0]?.replace(/^"|"$/g, "") ?? "",
    parts[1]?.replace(/^"|"$/g, "") ?? "",
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = (searchParams.get("team") ?? "").trim().toLowerCase();

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return Response.json({ error: "Failed to fetch sheet" }, { status: 500 });

  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());

  // Find the header row containing the team name (e.g. "Arizona Cardinals Category")
  let headerRowIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const [col0] = parseFirstTwoCols(lines[i]);
    if (col0.toLowerCase().includes(team)) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return Response.json({ error: "Team not found" }, { status: 404 });

  const rows: { category: string; score: string }[] = [];
  let rating = "";
  const summary: string[] = [];
  let foundRating = false;

  for (let i = headerRowIdx + 1; i < lines.length; i++) {
    const [col0, col1] = parseFirstTwoCols(lines[i]);

    // Stop if we hit the next team's header row
    if (!foundRating && col0.toLowerCase().includes("category") && i > headerRowIdx + 1) break;

    if (col0.toLowerCase().startsWith("overall staff rating:")) {
      rating = col0;
      foundRating = true;
      continue;
    }

    if (foundRating) {
      if (col0) summary.push(col0);
      continue;
    }

    if (col0) rows.push({ category: col0, score: col1 });
  }

  return Response.json({ rows, rating, summary });
}
