import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  // 确保 WebAssembly 文件被正确处理
  webpack: (config, { isServer }) => {
    // 允许导入 .wasm 文件
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // 确保 .wasm 文件不被 webpack 处理，而是作为静态资源
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
  // 禁用严格模式以避免 some 问题
  reactStrictMode: false,
};

export default nextConfig;
