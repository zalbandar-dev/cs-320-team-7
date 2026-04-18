import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'), // monorepo root — needed so Turbopack can reach hoisted node_modules
  },
};

export default nextConfig;