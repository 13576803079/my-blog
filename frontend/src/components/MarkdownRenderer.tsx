/**
 * Markdown 渲染组件
 *
 * 把 Markdown 文本渲染成 HTML，支持：
 * - 标题（带 id 锚点，供目录导航使用）
 * - 列表、链接、图片、表格（remark-gfm）
 * - 代码块语法高亮 + 复制按钮（rehype-highlight）
 * - XSS 防护（react-markdown 默认不执行脚本）
 */

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useState, useCallback } from "react";

// 引入代码高亮的 CSS 主题
import "highlight.js/styles/github.css";

interface MarkdownRendererProps {
  content: string;
  headings?: { id: string; text: string; level: 2 | 3 }[];
}

// 代码块复制按钮
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700/80 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      title="复制代码"
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}

export default function MarkdownRenderer({
  content,
  headings = [],
}: MarkdownRendererProps) {
  // 构建 heading text → id 的映射
  const headingMap = new Map(headings.map((h) => [h.text, h.id]));

  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 标题 - 添加 id 锚点
          h1: ({ children }) => (
            <h1 id={headingMap.get(String(children))} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 id={headingMap.get(String(children))} className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={headingMap.get(String(children))} className="text-xl font-semibold text-gray-800 mt-4 mb-2">
              {children}
            </h3>
          ),
          // 段落
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {children}
            </a>
          ),
          // 行内代码
          code: ({ className, children }) => {
            if (className) {
              return <code className={className}>{children}</code>;
            }
            return (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">
                {children}
              </code>
            );
          },
          // 代码块 - 添加复制按钮
          pre: ({ children }) => {
            // 提取代码文本用于复制
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const codeElement = children as any;
            const codeText = codeElement?.props?.children
              ? String(codeElement.props.children)
              : "";

            return (
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4 relative group">
                {children}
                <CopyButton text={codeText} />
              </pre>
            );
          },
          // 图片
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ""}
              className="max-w-full rounded-lg my-4"
            />
          ),
          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
              {children}
            </blockquote>
          ),
          // 无序列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">
              {children}
            </ul>
          ),
          // 有序列表
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 text-gray-700 space-y-1">
              {children}
            </ol>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
