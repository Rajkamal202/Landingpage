/**
 * Delimited-text parsing for the grid's clipboard and CSV import.
 *
 * SPEC §15: "Pasting a column out of Google Sheets and having it just work is
 * the feature that makes the screen believable." Sheets and Excel put TSV on
 * the clipboard as `text/plain`, and a cell containing a comma, a quote or a
 * line break comes across quoted — so a `split("\t")` is wrong the first time
 * someone copies body copy with a comma in it. This is a real RFC 4180 reader
 * that handles quoted fields, escaped quotes and embedded newlines.
 */

export type Matrix = string[][];

export function parseDelimited(text: string, delimiter: string): Matrix {
  const rows: Matrix = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let index = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"' && field === "") {
      quoted = true;
      index += 1;
      continue;
    }
    if (char === delimiter) {
      endField();
      index += 1;
      continue;
    }
    if (char === "\r") {
      index += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      index += 1;
      continue;
    }
    field += char;
    index += 1;
  }

  if (field !== "" || row.length > 0) endRow();
  // A trailing newline is a line terminator, not an empty final record.
  return rows.filter((line, position) => position < rows.length - 1 || line.some((cell) => cell !== ""));
}

/**
 * Spreadsheets hand over tabs; a `.csv` file hands over commas. Counting both
 * on the first few lines is more reliable than trusting a file extension that
 * may not exist for a clipboard payload.
 */
export function detectDelimiter(text: string): string {
  const sample = text.split("\n").slice(0, 5).join("\n");
  const tabs = (sample.match(/\t/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;
  return tabs >= commas && tabs > 0 ? "\t" : ",";
}

export function parseClipboard(text: string): Matrix {
  return parseDelimited(text.replace(/\r\n/g, "\n"), detectDelimiter(text));
}

function escapeField(value: string, delimiter: string): string {
  if (!value.includes(delimiter) && !value.includes('"') && !value.includes("\n")) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function serialize(matrix: ReadonlyArray<readonly string[]>, delimiter: string): string {
  return matrix.map((row) => row.map((cell) => escapeField(cell, delimiter)).join(delimiter)).join("\n");
}

/** What goes on the clipboard, so the round trip back into Sheets works. */
export const toTsv = (matrix: ReadonlyArray<readonly string[]>): string => serialize(matrix, "\t");
export const toCsv = (matrix: ReadonlyArray<readonly string[]>): string => serialize(matrix, ",");

/** Triggers a real file download — no server, no library. */
export function downloadTextFile(filename: string, contents: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: `${mime};charset=utf-8` }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
