/**
 * 搜索框组件（带防抖）
 *
 * 防抖（debounce）是前端优化的核心概念：
 * 用户输入时不要每次按键都发请求，而是等用户停顿一小段时间后再发。
 *
 * 比如用户输入"前端开发"：
 * - 没有防抖：输入"前"→ 请求，"前端"→ 请求，"前端开"→ 请求 ... 共 4 次请求
 * - 有防抖：等 300ms 没有新输入后才发请求 ... 共 1 次请求
 *
 * 这大大减少了服务器压力和网络流量。
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 搜索框主体（需要 useSearchParams，所以要包 Suspense）
function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("search") || "";
  const [query, setQuery] = useState(initialQuery);

  // 防抖搜索：用户停止输入 300ms 后才执行搜索
  // useCallback 确保函数引用稳定，不会每次渲染都重新创建
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim()) {
        router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push("/");
      }
    },
    [router]
  );

  // useEffect + setTimeout 实现防抖
  useEffect(() => {
    // 每次 query 变化时，设置一个 300ms 后执行的定时器
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    // 清理函数：如果 query 在 300ms 内又变了，取消上一次的定时器
    // 这就是防抖的核心原理
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div className="relative">
      {/* 搜索图标 */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索文章..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {/* 清除按钮 */}
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
    </div>
  );
}

// 导出时用 Suspense 包裹（因为内部用了 useSearchParams）
export default function SearchBar() {
  return (
    <Suspense fallback={<div className="w-full max-w-xs h-9" />}>
      <SearchInput />
    </Suspense>
  );
}
