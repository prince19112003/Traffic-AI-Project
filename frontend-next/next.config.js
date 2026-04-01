/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Performance improvement for websocket connections
  swcMinify: true,
};

module.exports = nextConfig;
