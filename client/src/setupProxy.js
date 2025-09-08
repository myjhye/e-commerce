const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // '/api'로 시작하는 모든 요청을 프록시합니다.
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000', // Django 서버 주소
      changeOrigin: true,
    })
  );

  app.use(
    '/media', // '/media'로 시작하는 모든 이미지 요청도 프록시합니다.
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000', // Django 서버 주소
      changeOrigin: true,
    })
  );
};