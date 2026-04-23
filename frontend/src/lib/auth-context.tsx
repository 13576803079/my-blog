/**
 * 认证上下文（Auth Context）
 *
 * 替代 NextAuth，提供全局认证状态管理：
 * - 用户信息（user）
 * - JWT token
 * - 登录 / 注册 / 登出方法
 * - 自动恢复会话（页面刷新后从 localStorage 读取 token）
 *
 * 使用方式：
 *   import { useAuth } from '@/lib/auth-context'
 *   const { user, login, logout, loading } = useAuth()
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiClient, setAuthCookie, clearAuthCookie } from "./api-client";

/** 用户信息类型 */
interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  bio?: string | null;
}

/** 认证上下文的值类型 */
interface AuthContextValue {
  /** 当前登录的用户信息，未登录时为 null */
  user: User | null;
  /** JWT token，未登录时为 null */
  token: string | null;
  /** 是否正在加载（初始化时检查 token） */
  loading: boolean;
  /** 登录方法 */
  login: (email: string, password: string) => Promise<void>;
  /** 注册方法 */
  register: (name: string, email: string, password: string) => Promise<void>;
  /** 登出方法 */
  logout: () => void;
}

// 创建 React Context
const AuthContext = createContext<AuthContextValue | null>(null);

/** 认证上下文提供者组件，包裹在根布局中 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 页面加载时恢复会话
   *
   * 从 localStorage 读取 token，如果存在则调用 GET /auth/me
   * 获取最新的用户信息。token 过期则清除。
   */
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        // 用保存的 token 请求当前用户信息
        const userData = await apiClient.get<User>("/auth/me");
        setUser(userData);
        setToken(savedToken);
      } catch {
        // token 无效或过期，清除本地数据
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * 登录
   *
   * 调用后端 POST /auth/login，成功后：
   * 1. 保存 token 到 localStorage
   * 2. 设置认证 cookie（供 middleware 使用）
   * 3. 更新 React 状态
   */
  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<{ access_token: string; user: User }>(
      "/auth/login",
      { email, password }
    );

    // 保存到 localStorage
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // 设置 cookie 供 middleware 检查
    setAuthCookie(data.access_token);

    // 更新状态
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  /**
   * 注册
   *
   * 调用后端 POST /auth/register，成功后自动登录
   */
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiClient.post<{ access_token: string; user: User }>(
        "/auth/register",
        { name, email, password }
      );

      // 注册成功后自动登录（和 login 一样的流程）
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setAuthCookie(data.access_token);

      setToken(data.access_token);
      setUser(data.user);
    },
    []
  );

  /**
   * 登出
   *
   * 清除所有本地认证数据（localStorage + cookie + React 状态）
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearAuthCookie();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * 在客户端组件中获取认证状态和方法。
 * 必须在 AuthProvider 内部使用。
 *
 * 使用示例：
 *   const { user, login, logout, loading } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 必须在 AuthProvider 内部使用");
  }
  return context;
}
