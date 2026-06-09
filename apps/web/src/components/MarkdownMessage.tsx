import { ReactNode } from "react";

type Props = {
  content: string;
};

type ListItem = {
  text: string;
  ordered: boolean;
};

const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)|\*[^*]+\*)/g;

function inlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const [token, linkHref] = match;
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(text.slice(cursor, index));
    }

    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const labelEnd = token.indexOf("]");
      nodes.push(
        <a key={key} href={linkHref} target="_blank" rel="noreferrer">
          {token.slice(1, labelEnd)}
        </a>
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    cursor = index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function flushList(blocks: ReactNode[], items: ListItem[], key: string) {
  if (!items.length) return;
  const ordered = items[0].ordered;
  const children = items.map((item, index) => <li key={`${key}-item-${index}`}>{inlineMarkdown(item.text, `${key}-${index}`)}</li>);
  blocks.push(ordered ? <ol key={key}>{children}</ol> : <ul key={key}>{children}</ul>);
  items.length = 0;
}

export default function MarkdownMessage({ content }: Props) {
  const blocks: ReactNode[] = [];
  const listItems: ListItem[] = [];
  const lines = content.split(/\r?\n/);
  let codeLines: string[] = [];
  let inCode = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push(
          <pre key={`code-${index}`}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        flushList(blocks, listItems, `list-${index}`);
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!trimmed) {
      flushList(blocks, listItems, `list-${index}`);
      return;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushList(blocks, listItems, `list-${index}`);
      const level = heading[1].length;
      const children = inlineMarkdown(heading[2], `heading-${index}`);
      if (level === 1) blocks.push(<h3 key={`heading-${index}`}>{children}</h3>);
      if (level === 2) blocks.push(<h4 key={`heading-${index}`}>{children}</h4>);
      if (level === 3) blocks.push(<h5 key={`heading-${index}`}>{children}</h5>);
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (unordered || ordered) {
      const nextItem = {
        text: (unordered ?? ordered)?.[1] ?? "",
        ordered: Boolean(ordered),
      };
      if (listItems.length && listItems[0].ordered !== nextItem.ordered) {
        flushList(blocks, listItems, `list-${index}`);
      }
      listItems.push(nextItem);
      return;
    }

    flushList(blocks, listItems, `list-${index}`);
    blocks.push(<p key={`paragraph-${index}`}>{inlineMarkdown(trimmed, `paragraph-${index}`)}</p>);
  });

  flushList(blocks, listItems, "list-final");

  if (inCode && codeLines.length) {
    blocks.push(
      <pre key="code-final">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className="markdown-message">{blocks}</div>;
}
