const proxyConfig = {
  '/api': {
    target: `http://localhost:${process.env.VITE_API_SERVER_PORT || 3001}`,
    changeOrigin: true,
    secure: false,
    ws: true
  },
  '/ws': {
    target: `ws://localhost:${process.env.VITE_API_SERVER_PORT || 3001}`,
    ws: true,
    changeOrigin: true
  }
};

export default proxyConfig;
