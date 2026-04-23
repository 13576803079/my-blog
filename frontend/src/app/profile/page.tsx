/**
 * 个人资料编辑页面
 *
 * 改为使用 apiClient 调用 NestJS 后端 API：
 * - GET /user/profile：获取当前用户资料
 * - PUT /user/profile：更新用户名、头像、简介
 * 之前用 useSession() 和 fetch /api/user。
 * UI 保持不变。
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";

/** 用户资料类型 */
interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 表单状态
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");

  // 未登录时重定向
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // 加载完整用户资料（包含 bio）
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiClient.get<UserProfile>("/user/profile");
        setName(data.name || "");
        setImage(data.image || "");
        setBio(data.bio || "");
      } catch {
        // 如果 API 调用失败，使用 auth context 中的基本信息
        if (user) {
          setName(user.name || "");
          setImage(user.image || "");
        }
      }
    }
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // 调用 NestJS 后端 API 更新资料
      await apiClient.put("/user/profile", {
        name,
        bio,
        image,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  // 认证加载中
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!user) return null;

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
