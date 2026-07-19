import { Fragment, type ReactNode } from "react";

type MarkdownContentProps = {
  source: string;
  className?: string;
  omitTitle?: boolean;
};

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*.+?\*\*)/g).filter(Boolean).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

export default function MarkdownContent({ source, className = "", omitTitle = false }: MarkdownContentProps) {
  const lines = source.trim().split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "))}</p>);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {list.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
      </ul>,
    );
    list = [];
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      if (omitTitle && level === 1) return;
      if (level === 1) blocks.push(<h1 key={`h1-${blocks.length}`}>{renderInline(heading[2])}</h1>);
      else if (level === 2) blocks.push(<h2 key={`h2-${blocks.length}`}>{renderInline(heading[2])}</h2>);
      else blocks.push(<h3 key={`h3-${blocks.length}`}>{renderInline(heading[2])}</h3>);
      return;
    }
    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2));
      return;
    }
    flushList();
    paragraph.push(trimmed);
  });
  flushParagraph();
  flushList();

  return <div className={`legal-markdown ${className}`.trim()}>{blocks}</div>;
}
