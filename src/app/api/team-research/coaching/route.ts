const SHEET_ID = "1KPfVL7EWIClQqvLGtg-g6CN49O32n60LBhmvxBwklEg";
const SHEET_NAME = "Coaching Staff";

function parseFirstThreeCols(line: string): [string, string, string] {
  const match = line.match(/^"((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)"/) ;
  if (match) return [match[1], match[2], match[3]];
  const parts = line.split(",");
  return [
    parts[0]?.replace(/^"|"$/g, "") ?? "",
    parts[1]?.replace(/^"|"$/g, "") ?? "",
    parts[2]?.replace(/^"|"$/g, "") ?? "",
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

  // Find team name row
  let teamRowIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const [col0] = parseFirstThreeCols(lines[i]);
    if (col0.trim().toLowerCase() === team) {
      teamRowIdx = i;
      break;
    }
  }

  if (teamRowIdx === -1) return Response.json({ error: "Team not found" }, { status: 404 });

  // Row after team name is headers — skip it (teamRowIdx + 1)
  // Data rows start at teamRowIdx + 2
  const rows: { category: string; grade: string; notes: string }[] = [];
  let rating = "";
  const summary: string[] = [];
  let foundRating = false;

  for (let i = teamRowIdx + 2; i < lines.length; i++) {
    const [col0, col1, col2] = parseFirstThreeCols(lines[i]);

    if (!foundRating && !col1 && !col2 && col0 && !col0.startsWith("Overall Staff Rating:") && i > teamRowIdx + 2) break;

    if (col0.startsWith("Overall Staff Rating:")) {
      rating = col0;
      foundRating = true;
      continue;
    }

    if (foundRating) {
      // Stop if we hit the next team's name row (short col0, no grade column)
      if (col0 && !col1 && !col2 && col0.length < 40) break;
      if (col0) summary.push(col0);
      continue;
    }

    if (col0) rows.push({ category: col0, grade: col1, notes: col2 });
  }

  return Response.json({ rows, rating, summary });
}
