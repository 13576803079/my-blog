/**
 * 图片上传组件
 *
 * 这个组件展示了前端全栈交互中常见的文件上传模式：
 * 1. 用户选择文件 → 预览
 * 2. 上传到服务器 → 获取 URL
 * 3. 将 URL 传递给父表单
 *
 * 核心概念：
 * - FileReader API 读取本地文件做预览
 * - fetch + FormData 发送文件到 API
 * - 受控组件模式：父组件通过 onChange 获取上传结果
 */

"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  /** 当前图片 URL（编辑模式下回填用） */
  value?: string;
  /** 上传完成后的回调，返回图片 URL */
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  // 预览图片地址（本地 blob 或服务器 URL）
  const [preview, setPreview] = useState<string | null>(value || null);
  // 上传状态
  const [uploading, setUploading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 隐藏的原生 file input 引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择
   * 先做本地预览，再上传到服务器
   */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 本地预览：用 FileReader 把文件转成 blob URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传到服务器
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // 调用图片上传 API 路由
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }

      // 上传成功，把 URL 传给父组件
      onChange(data.url);
      // 更新预览为服务器返回的 URL
      setPreview(data.url);
    } catch {
      setError("网络错误，上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {/* 隐藏的原生 file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 预览区域 / 上传按钮 */}
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="封面预览"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          {/* 鼠标悬停时显示"重新选择"按钮 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
          >
            {uploading ? "上传中..." : "重新选择"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          {uploading ? (
            "上传中..."
          ) : (
            <>
              <span className="text-2xl mb-2">+</span>
              <span className="text-sm">点击上传封面图片</span>
            </>
          )}
        </button>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
