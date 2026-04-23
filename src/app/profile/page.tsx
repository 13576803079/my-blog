/**
 * 个人资料编辑页面
 *
 * 被 middleware 保护，需要登录。
 * 用户可以修改：用户名、个人简介、头像
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 表单状态
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");

  // session 加载完成后回填数据
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || "");
    }
  }, [session]);

  // 加载 bio（session 里没有 bio，需要单独获取）
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setBio(data.data?.bio || "");
          if (data.data?.image) setImage(data.data.image);
        }
      } catch {
        // 静默失败
      }
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, image }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新失败");
        return;
      }

      // 更新 NextAuth 的 session（让导航栏显示新名字）
      await updateSession({ name });
      setSuccess(true);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/dashboard"
        className="text-blue-600 hover:underline text-sm mb-6 inline-block"
      >
        ← 返回管理
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑资料</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
          保存成功！
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 头像 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            头像
          </label>
          <div className="w-32">
            <ImageUpload value={image} onChange={(url) => setImage(url)} />
          </div>
        </div>

        {/* 用户名 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            用户名
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 个人简介 */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            个人简介
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="介绍一下你自己..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{bio.length}/200</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
