/**
 * 目录导航组件 (TOC)
 *
 * 从 markdown 提取的标题列表生成侧边栏目录。
 * 点击标题可平滑滚动到对应位置。
 * 使用 IntersectionObserver 高亮当前阅读到的标题。
 */

"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 使用 IntersectionObserver 监听标题进入视口
    const observer = new IntersectionObserver(
      (entries) => {
        // 取最后一个进入视口的标题作为当前活跃标题
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[visibleEntries.length - 1].target.id);
        }
      },
      {
        // 标题在视口顶部 20% 到底部 80% 范围内视为"当前阅读位置"
        rootMargin: "-10% 0px -80% 0px",
      }
    );

    // 观察所有标题元素
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="hidden lg:block">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">目录</h3>
      <ul className="space-y-1.5 text-sm border-l-2 border-gray-200">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => handleClick(heading.id)}
              className={`block w-full text-left transition-colors ${
                heading.level === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === heading.id
                  ? "text-blue-600 font-medium border-l-2 border-blue-600 -ml-0.5"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
