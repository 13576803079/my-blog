/**
 * API 统一响应格式
 *
 * 全栈开发中，API 响应格式必须统一。
 * 前端才能用同一套逻辑处理所有接口的返回值。
 *
 * 格式规范：
 * 成功：{ success: true, data: {...}, meta?: {...} }
 * 失败：{ success: false, error: "错误信息" }
 *
 * meta 用于放分页信息等附加数据。
 */

import { NextResponse } from "next/server";

// 成功响应的类型
interface SuccessResponse<T> {
  success: true;
  data: T;
  // 可选的元数据（分页信息等）
  meta?: {
    total: number; // 总记录数
    page: number; // 当前页码
    limit: number; // 每页条数
    totalPages: number; // 总页数
  };
}

// 错误响应的类型
interface ErrorResponse {
  success: false;
  error: string;
}

// 合并为联合类型
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * 返回成功响应
 *
 * 用法：
 *   return success({ id: 1, title: "hello" })
 *   return success(posts, { total: 100, page: 1, limit: 10, totalPages: 10 })
 */
export function success<T>(data: T, meta?: SuccessResponse<T>["meta"]): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

/**
 * 返回分页成功响应
 *
 * 自动计算 totalPages，方便调用
 */
export function paginatedSuccess<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * 返回错误响应
 *
 * 用法：
 *   return error("文章不存在", 404)
 *   return error("服务器错误", 500)
 */
export function error(message: string, status: number = 400): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * 常用 HTTP 状态码速查
 *
 * 200 OK          - 请求成功
 * 201 Created     - 资源创建成功
 * 400 Bad Request - 客户端参数错误
 * 401 Unauthorized - 未登录
 * 403 Forbidden   - 无权限
 * 404 Not Found   - 资源不存在
 * 500 Internal    - 服务器内部错误
 */
