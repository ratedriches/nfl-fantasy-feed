import { parseFirstThreeCols } from "@/lib/sheet-parser";

const SHEET_ID = "1KPfVL7EWIClQqvLGtg-g6CN49O32n60LBhmvxBwklEg";
const SHEET_NAME = "Offense Players";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = (searchParams.get("team") ?? "").trim().toLowerCase();

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return Response.json({ error: "Failed to fetch sheet" }, { status: 500 });

  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim());

  // Find team row
  let teamRowIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const [col0] = parseFirstThreeCols(lines[i]);
    if (col0.trim().toLowerCase() === team) {
      teamRowIdx = i;
      break;
    }
  }

  if (teamRowIdx === -1) return Response.json({ error: "Team not found" }, { status: 404 });

  const [sectionTitle] = parseFirstThreeCols(lines[teamRowIdx + 1] ?? "");

  // teamRowIdx+2 is headers row — skip it
  const rows: { category: string; grade: string; notes: string }[] = [];
  let rating = "";
  const summary: string[] = [];
  let foundRating = false;

  for (let i = teamRowIdx + 3; i < lines.length; i++) {
    const [col0, col1, col2] = parseFirstThreeCols(lines[i]);

    // Stop if we hit the next team's name row (non-empty col0, empty col1&col2, looks like a team name)
    if (!foundRating && !col1 && !col2 && col0 && !col0.startsWith("CURRENT RATING:") && i > teamRowIdx + 3) break;

    if (col0.startsWith("CURRENT RATING:")) {
      rating = col0;
      foundRating = true;
      continue;
    }

    if (foundRating) {
      // Stop if we hit the next team's name row (short col0, no grade/notes columns)
      if (col0 && !col1 && !col2 && col0.length < 40) break;
      if (col0) summary.push(col0);
      continue;
    }

    if (col0) rows.push({ category: col0, grade: col1, notes: col2 });
  }

  return Response.json({ sectionTitle, rows, rating, summary });
}
