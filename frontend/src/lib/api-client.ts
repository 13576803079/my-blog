/**
 * API 客户端封装
 *
 * 统一封装所有与 NestJS 后端的 HTTP 通信：
 * - 自动附加 Bearer token（从 localStorage 读取）
 * - 统一错误处理（401 自动清除 token）
 * - 提供 get / post / put / del / upload 方法
 *
 * 所有前端组件都应该通过这个客户端与后端交互，
 * 而不是直接使用 fetch。
 */

// 后端 API 基础地址，从环境变量读取，默认 http://localhost:4000
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * 从 localStorage 获取认证 token
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * 清除本地存储的 token 和用户信息
 * 当后端返回 401 时调用，表示登录已过期
 */
function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // 同时清除用于 middleware 验证的 cookie
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * 设置认证 cookie（供 Next.js middleware 读取）
 * middleware 运行在服务端，无法访问 localStorage，
 * 所以通过 httpOnly=false 的 cookie 来传递 token 存在状态
 */
export function setAuthCookie(token: string) {
  // 设置 30 天过期的 cookie，与 JWT 有效期一致
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `token=${token}; path=/; expires=${expires}; SameSite=Lax`;
}

/**
 * 清除认证 cookie
 */
export function clearAuthCookie() {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * 通用请求方法
 *
 * @param path - API 路径（不含基础地址），如 /posts、/auth/login
 * @param options - fetch 选项
 * @returns 响应数据（JSON 解析后的对象）
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  // 构建请求头，自动附加 Authorization
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // FormData 上传时不手动设置 Content-Type，浏览器会自动加 boundary
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // 如果有 token，附加到请求头
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 401 表示 token 过期或无效，清除本地认证信息
  if (res.status === 401) {
    clearAuth();
  }

  // 解析响应 JSON
  const data = await res.json();

  // 非 2xx 状态码视为错误
  if (!res.ok) {
    throw new Error(data.message || data.error || "请求失败");
  }

  return data as T;
}

/**
 * API 客户端对象
 *
 * 使用示例：
 *   import { apiClient } from '@/lib/api-client'
 *
 *   // GET 请求
 *   const posts = await apiClient.get('/posts?page=1&limit=5')
 *
 *   // POST 请求
 *   const result = await apiClient.post('/posts', { title: '...', content: '...' })
 *
 *   // 文件上传
 *   const { url } = await apiClient.upload('/upload', formData)
 */
export const apiClient = {
  /** GET 请求 */
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },

  /** POST 请求（JSON body） */
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /** PUT 请求（JSON body） */
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /** DELETE 请求 */
  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },

  /** 文件上传（FormData body） */
  upload<T>(path: string, formData: FormData): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: formData,
    });
  },
};
