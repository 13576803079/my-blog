/**
 * 从 Markdown 内容中提取标题列表
 *
 * 用于生成目录导航（TOC）。
 * 只提取 h2 和 h3 级别的标题。
 */

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  // 匹配 h2 (## ) 和 h3 (### ) 级别的标题
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    // 去除标题中的行内格式标记
    const text = match[2]
      .replace(/\*\*|__/g, "")
      .replace(/\*|_/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .trim();

    if (text) {
      headings.push({
        id: `heading-${headings.length}`,
        text,
        level,
      });
    }
  }

  return headings;
}
