const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: "if (typeof self === 'undefined') { global.self = global; }",
          raw: true,
          entryOnly: false,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
