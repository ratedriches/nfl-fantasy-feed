// Proper CSV parser that handles "" as an escaped quote inside a field
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++; // skip opening quote
      let field = "";
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      cols.push(field);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        cols.push(line.slice(i));
        break;
      } else {
        cols.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }
  return cols;
}

export function parseFirstThreeCols(line: string): [string, string, string] {
  const cols = parseCSVLine(line);
  return [cols[0] ?? "", cols[1] ?? "", cols[2] ?? ""];
}
