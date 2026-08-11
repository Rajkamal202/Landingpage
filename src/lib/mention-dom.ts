import type { PromptToken } from "@/lib/schemas";

/**
 * DOM plumbing for the `@` reference input.
 *
 * SPEC §15: "A regex over a string will feel broken the first time someone
 * backspaces. Build real tokens." So a mention is an inline
 * `contenteditable="false"` element. The browser then treats it as a single
 * atom for backspace, delete, arrow keys and selection — which is exactly the
 * behaviour a hand-rolled regex model spends hundreds of lines failing to
 * reproduce.
 *
 * These helpers translate between that DOM and the typed `PromptToken[]` the
 * rest of the app stores.
 */

export const MENTION_ATTR = "data-asset-id";
export const MENTION_LABEL_ATTR = "data-asset-label";

/** Reads the editor's DOM into the typed token model. */
export function serializeTokens(root: HTMLElement): PromptToken[] {
  const tokens: PromptToken[] = [];

  const pushText = (value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    if (last?.type === "text") last.value += value;
    else tokens.push({ type: "text", value });
  };

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        pushText(child.textContent ?? "");
        continue;
      }
      if (!(child instanceof HTMLElement)) continue;

      const assetId = child.getAttribute(MENTION_ATTR);
      if (assetId) {
        tokens.push({
          type: "mention",
          assetId,
          label: child.getAttribute(MENTION_LABEL_ATTR) ?? child.textContent?.slice(1) ?? "",
        });
        continue;
      }
      if (child.tagName === "BR") {
        pushText("\n");
        continue;
      }
      walk(child);
    }
  };

  walk(root);
  return tokens;
}

export function createMentionElement(assetId: string, label: string): HTMLElement {
  const element = document.createElement("span");
  element.setAttribute(MENTION_ATTR, assetId);
  element.setAttribute(MENTION_LABEL_ATTR, label);
  element.setAttribute("contenteditable", "false");
  element.className = "mention-chip";
  element.textContent = `@${label}`;
  return element;
}

/** Renders the typed model back into the editor. Used only on external change. */
export function renderTokens(root: HTMLElement, tokens: readonly PromptToken[]): void {
  root.replaceChildren();
  for (const token of tokens) {
    if (token.type === "mention") {
      root.append(createMentionElement(token.assetId, token.label));
    } else {
      root.append(document.createTextNode(token.value));
    }
  }
}

export interface MentionQuery {
  /** The text between `@` and the caret. */
  query: string;
  /** The text node holding the trigger, and the offsets to replace. */
  node: Text;
  start: number;
  end: number;
}

/**
 * Finds an in-progress `@mention` immediately before the caret. Returns null
 * when the caret is not in a mention — including when `@` is preceded by a
 * word character, so an email address never opens the picker.
 */
export function findMentionQuery(root: HTMLElement): MentionQuery | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  if (!root.contains(node)) return null;

  const textNode = node as Text;
  const caret = range.startOffset;
  const before = textNode.data.slice(0, caret);

  const at = before.lastIndexOf("@");
  if (at === -1) return null;

  const query = before.slice(at + 1);
  // A mention query is one word; a space means the user moved on.
  if (/\s/.test(query)) return null;

  const preceding = at > 0 ? before[at - 1] : undefined;
  if (preceding !== undefined && /[\w@]/.test(preceding)) return null;

  return { query, node: textNode, start: at, end: caret };
}

/** Replaces the `@query` text with a chip and places the caret after it. */
export function replaceQueryWithMention(
  target: MentionQuery,
  assetId: string,
  label: string,
): void {
  const { node, start, end } = target;
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  range.deleteContents();

  const chip = createMentionElement(assetId, label);
  // The trailing space is what lets the user keep typing without the caret
  // landing inside the chip.
  const spacer = document.createTextNode(" ");
  range.insertNode(spacer);
  range.insertNode(chip);

  const selection = window.getSelection();
  if (!selection) return;
  const after = document.createRange();
  after.setStartAfter(spacer);
  after.collapse(true);
  selection.removeAllRanges();
  selection.addRange(after);
}

/** Inserts a mention at the caret, for drag-and-drop from the library. */
export function insertMentionAtCaret(root: HTMLElement, assetId: string, label: string): void {
  const selection = window.getSelection();
  const chip = createMentionElement(assetId, label);
  const spacer = document.createTextNode(" ");

  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
    root.append(chip, spacer);
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(spacer);
  range.insertNode(chip);

  const after = document.createRange();
  after.setStartAfter(spacer);
  after.collapse(true);
  selection.removeAllRanges();
  selection.addRange(after);
}

export function tokensAreEqual(a: readonly PromptToken[], b: readonly PromptToken[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((token, index) => {
    const other = b[index];
    if (!other || token.type !== other.type) return false;
    if (token.type === "text" && other.type === "text") return token.value === other.value;
    if (token.type === "mention" && other.type === "mention") {
      return token.assetId === other.assetId && token.label === other.label;
    }
    return false;
  });
}
