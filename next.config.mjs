/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project so Turbopack stops warning about
  // sibling lockfiles (e.g. the marketing site's package-lock.json one folder up).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
