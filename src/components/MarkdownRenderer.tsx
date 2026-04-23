/**
 * Markdown 渲染组件
 *
 * 把 Markdown 文本渲染成 HTML，支持：
 * - 标题、列表、链接、图片、表格（remark-gfm）
 * - 代码块语法高亮（rehype-highlight）
 * - XSS 防护（react-markdown 默认不执行脚本）
 *
 * 为什么用 react-markdown 而不是 dangerouslySetInnerHTML？
 * dangerouslySetInnerHTML 会执行 HTML 中的 <script> 标签，
 * 存在 XSS（跨站脚本攻击）风险。
 * react-markdown 会把 Markdown 转成安全的 React 元素，
 * 不存在注入风险。
 */

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// 引入代码高亮的 CSS 主题（可以换成其他主题）
import "highlight.js/styles/github.css";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown
        // remark-gfm 支持 GitHub 风格的 Markdown（表格、删除线、任务列表）
        remarkPlugins={[remarkGfm]}
        // rehype-highlight 给代码块加语法高亮
        rehypePlugins={[rehypeHighlight]}
        // 自定义各元素的渲染样式
        components={{
          // 标题
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">
              {children}
            </h3>
          ),
          // 段落
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
          ),
          // 链接（在新窗口打开）
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
            // 有 className 表示是代码块（```xxx），行内代码没有 className
            if (className) {
              // 代码块：让 highlight.js 处理高亮
              return <code className={className}>{children}</code>;
            }
            // 行内代码：灰色背景
            return (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">
                {children}
              </code>
            );
          },
          // 代码块外层容器
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4">
              {children}
            </pre>
          ),
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
