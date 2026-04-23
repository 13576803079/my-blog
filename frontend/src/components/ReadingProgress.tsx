/**
 * 阅读进度条组件
 *
 * 固定在页面顶部，显示当前文章的阅读进度百分比。
 * 监听 scroll 事件，计算文章区域的滚动比例。
 */

"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // 找到文章元素
      const article = document.querySelector("article[data-article]");
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const articleHeight = rect.height;
      // 文章顶部相对于视口的位置
      const scrolledPast = -rect.top;
      // 可滚动的总距离
      const scrollableDistance = articleHeight - window.innerHeight;

      if (scrollableDistance <= 0) {
        setProgress(100);
        return;
      }

      const percent = Math.min(
        100,
        Math.max(0, (scrolledPast / scrollableDistance) * 100)
      );
      setProgress(percent);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // 初始计算一次
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-gray-100">
      <div
        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
