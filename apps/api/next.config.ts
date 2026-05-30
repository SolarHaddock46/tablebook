import { loadEnv } from "@tablebook/db";
import type { NextConfig } from "next";

loadEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@tablebook/shared", "@tablebook/db"],
  output: "standalone",
  allowedDevOrigins: [
    "192.168.15.88",
    "http://192.168.15.88:8081",
    "http://localhost:8081"
  ]
};

export default nextConfig;
