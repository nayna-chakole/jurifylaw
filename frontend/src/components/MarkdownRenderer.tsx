"use client";

import React, { ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

function renderInline(text: string): ReactNode[] {
  const elements: ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  parts.forEach((part, index) => {
    if (!part) return;

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      elements.push(
        <strong key={index} className="font-bold text-[#1E1B4B]">
          {renderInline(inner)}
        </strong>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      elements.push(
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] font-mono text-[11px] sm:text-xs border border-purple-200/60 font-semibold mx-0.5"
        >
          {inner}
        </code>
      );
    } else if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      elements.push(
        <em key={index} className="italic text-slate-600 font-medium">
          {renderInline(inner)}
        </em>
      );
    } else if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        elements.push(
          <a
            key={index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7C3AED] underline font-semibold hover:text-[#6D28D9] transition"
          >
            {match[1]}
          </a>
        );
      } else {
        elements.push(part);
      }
    } else {
      elements.push(part);
    }
  });

  return elements;
}

export default function MarkdownRenderer({
  content,
  className = "",
  isUser = false,
}: MarkdownRendererProps) {
  if (isUser) {
    return <div className={`whitespace-pre-wrap font-normal ${className}`}>{content}</div>;
  }

  if (!content) return null;

  const lines = content.split("\n");
  const blocks: ReactNode[] = [];

  let currentListItems: ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} className="space-y-2.5 my-2.5 list-none pl-0">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code block fences (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(
          <div
            key={`codeblock-${idx}`}
            className="my-2.5 rounded-2xl bg-slate-900 text-slate-100 p-3.5 text-xs font-mono overflow-x-auto border border-slate-800"
          >
            <pre className="whitespace-pre">{codeBlockLines.join("\n")}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList(idx);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Empty lines flush active lists
    if (!trimmed) {
      flushList(idx);
      return;
    }

    // Headers (#, ##, ###)
    if (trimmed.startsWith("### ")) {
      flushList(idx);
      blocks.push(
        <h3 key={`h3-${idx}`} className="text-xs sm:text-sm font-bold text-purple-950 mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList(idx);
      blocks.push(
        <h2 key={`h2-${idx}`} className="text-sm sm:text-base font-bold text-[#1E1B4B] mt-3 mb-1">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList(idx);
      blocks.push(
        <h1 key={`h1-${idx}`} className="text-base sm:text-lg font-bold text-[#1E1B4B] mt-3.5 mb-1.5 border-b border-purple-100 pb-1">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Note or Disclaimer block (e.g. *(Note: ...)* or (Note: ...) or > ...)
    if (
      trimmed.startsWith(">") ||
      (trimmed.startsWith("*(") && trimmed.endsWith(")*")) ||
      (trimmed.startsWith("(") && trimmed.toLowerCase().includes("note:") && trimmed.endsWith(")"))
    ) {
      flushList(idx);
      const noteContent = trimmed.startsWith(">") ? trimmed.slice(1).trim() : trimmed;
      blocks.push(
        <div
          key={`note-${idx}`}
          className="my-3 p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-[11px] sm:text-xs text-purple-900 leading-relaxed italic"
        >
          {renderInline(noteContent)}
        </div>
      );
      return;
    }

    // Bullet points (-, *, •, ●, ▪)
    const bulletMatch = trimmed.match(/^[-*•●▪]\s+(.*)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      currentListItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2.5 leading-relaxed text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] shrink-0 mt-2" />
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );
      return;
    }

    // Numbered list items (1. 2. ...)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const itemText = numMatch[2];
      currentListItems.push(
        <li key={`num-li-${idx}`} className="flex items-start gap-2 leading-relaxed text-slate-700">
          <span className="font-bold text-[#7C3AED] text-xs shrink-0 mt-0.5">{num}.</span>
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );
      return;
    }

    // Regular paragraph
    flushList(idx);
    blocks.push(
      <p key={`p-${idx}`} className="leading-relaxed text-slate-700 font-normal">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList("end");

  if (inCodeBlock && codeBlockLines.length > 0) {
    blocks.push(
      <div
        key="codeblock-end"
        className="my-2.5 rounded-2xl bg-slate-900 text-slate-100 p-3.5 text-xs font-mono overflow-x-auto border border-slate-800"
      >
        <pre className="whitespace-pre">{codeBlockLines.join("\n")}</pre>
      </div>
    );
  }

  return (
    <div className={`markdown-content text-slate-800 leading-relaxed space-y-2 text-xs sm:text-sm ${className}`}>
      {blocks}
    </div>
  );
}
