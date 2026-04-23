/**
 * 分页组件
 *
 * URL 驱动分页：页码存在 URL 参数 ?page=2 中。
 * 优点：刷新不丢失、可以分享、浏览器前进后退支持。
 *
 * 客户端组件，因为需要 useSearchParams 读取当前页码。
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface PaginationProps {
  totalPages: number;
}

function PaginationInner({ totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");

  if (totalPages <= 1) return null;

  // 生成页码数组（最多显示 5 个页码，中间省略）
  function getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* 上一页 */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        上一页
      </button>

      {/* 页码 */}
      {getPageNumbers().map((page, i) =>
        typeof page === "string" ? (
          <span key={`dot-${i}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              page === currentPage
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* 下一页 */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        下一页
      </button>
    </div>
  );
}

export default function Pagination(props: PaginationProps) {
  return (
    <Suspense>
      <PaginationInner {...props} />
    </Suspense>
  );
}
