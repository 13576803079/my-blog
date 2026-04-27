import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署时生成独立可运行的最小化输出，镜像体积从 ~1GB 降到 ~200MB
  output: "standalone",
};

export default nextConfig;
