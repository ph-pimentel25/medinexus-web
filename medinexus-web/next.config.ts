import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Vercel file traces relative to the repository containing this app.
  outputFileTracingRoot: path.resolve(__dirname, ".."),
};

export default nextConfig;
