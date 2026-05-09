import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin file-tracing to this dir so Next doesn't pick up an outer lockfile
  // when nested in a parent workspace (e.g., Vercel monorepo or local home).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
