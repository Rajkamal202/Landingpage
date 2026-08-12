"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { MediaKind, PromptToken } from "@/lib/schemas";
import {
  findMentionQuery,
  insertMentionAtCaret,
  renderTokens,
  replaceQueryWithMention,
  serializeTokens,
  tokensAreEqual,
  type MentionQuery,
} from "@/lib/mention-dom";
import { Icon } from "@/components/icon";
import { IconAudio, IconImage, IconVideo } from "@/components/icons";
import { popSurface } from "./surface";

/**
 * SPEC §8.2 and §15 — the `@` reference input, shared by the studio composer
 * and the canvas Prompt node.
 *
 * The value is `PromptToken[]`, never a string: a mention carries a real asset
 * id, and because it renders as a `contenteditable="false"` chip the browser
 * deletes it as one unit. Typing `@` opens a picker filtered as you type;
 * Escape dismisses it without touching the text.
 */
export interface MentionOption {
  id: string;
  label: string;
  kind: MediaKind;
  poster?: string;
}

export interface MentionInputProps {
  value: PromptToken[];
  onValueChange: (value: PromptToken[]) => void;
  options: readonly MentionOption[];
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  onSubmit?: () => void;
}

const KIND_ICON = { video: IconVideo, image: IconImage, audio: IconAudio } as const;

export function MentionInput({
  value,
  onValueChange,
  options,
  placeholder = "Describe the shot you want",
  ariaLabel,
  disabled = false,
  className,
  onSubmit,
}: MentionInputProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastEmitted = React.useRef<PromptToken[]>(value);
  const queryRef = React.useRef<MentionQuery | null>(null);

  const [query, setQuery] = React.useState<string | null>(null);
  const [highlighted, setHighlighted] = React.useState(0);
  const [isEmpty, setIsEmpty] = React.useState(value.length === 0);

  const matches = React.useMemo(() => {
    if (query === null) return [];
    const needle = query.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle)).slice(0, 6);
  }, [options, query]);

  // Re-render the editor only when the value changed somewhere other than
  // here; writing on every keystroke would reset the caret to position zero.
  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (tokensAreEqual(value, lastEmitted.current)) return;
    renderTokens(editor, value);
    lastEmitted.current = value;
    setIsEmpty(value.length === 0);
  }, [value]);

  const emit = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const tokens = serializeTokens(editor);
    lastEmitted.current = tokens;
    setIsEmpty(editor.textContent?.trim().length === 0);
    onValueChange(tokens);
  }, [onValueChange]);

  const syncQuery = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const found = findMentionQuery(editor);
    queryRef.current = found;
    setQuery(found?.query ?? null);
    setHighlighted(0);
  }, []);

  const choose = React.useCallback(
    (option: MentionOption) => {
      const target = queryRef.current;
      const editor = editorRef.current;
      if (!editor) return;
      if (target) replaceQueryWithMention(target, option.id, option.label);
      else insertMentionAtCaret(editor, option.id, option.label);
      queryRef.current = null;
      setQuery(null);
      emit();
      editor.focus();
    },
    [emit],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (query !== null && matches.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlighted((index) => (index + 1) % matches.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlighted((index) => (index - 1 + matches.length) % matches.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const option = matches[highlighted];
        if (option) {
          event.preventDefault();
          choose(option);
          return;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery(null);
        queryRef.current = null;
        return;
      }
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={editorRef}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        spellCheck
        onInput={() => {
          emit();
          syncQuery();
        }}
        onKeyUp={syncQuery}
        onClick={syncQuery}
        onBlur={() => {
          // Delay so a click on an option lands before the picker unmounts.
          window.setTimeout(() => setQuery(null), 120);
        }}
        onKeyDown={onKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "mention-editor max-h-32 min-h-6 w-full overflow-y-auto text-body-md text-ink-950",
          "focus-visible:outline-none",
          disabled && "cursor-not-allowed text-ink-300",
          isEmpty && "is-empty",
        )}
      />

      {/* `aria-expanded` is not valid on `textbox`, so the picker announces
          itself through a live region instead of a state attribute. */}
      <span aria-live="polite" className="sr-only">
        {query !== null && matches.length > 0
          ? `${matches.length} ${matches.length === 1 ? "reference" : "references"} match. Use arrow keys to choose.`
          : ""}
      </span>

      {query !== null && matches.length > 0 ? (
        <ul
          role="listbox"
          aria-label="Library references"
          className={cn(popSurface, "absolute bottom-full left-0 mb-2 w-sheet")}
        >
          {matches.map((option, index) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlighted}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left",
                  "text-body-sm transition-ui duration-(--dur-instant)",
                  index === highlighted ? "bg-ink-100 text-ink-950" : "text-ink-700",
                )}
              >
                {option.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={option.poster}
                    alt=""
                    className="size-8 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-ink-100 text-ink-500">
                    <Icon glyph={KIND_ICON[option.kind]} size={16} />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <span className="mono-sm text-ink-500">@{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
