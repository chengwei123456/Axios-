module.exports = {
  devServer: {
    host: 'localhost', 
    port: 8080, 
    proxy: {
      '/api': {
          target: 'http://192.168.209.208:80',//后端接口地址
          changeOrigin: true,//是否允许跨越
          pathRewrite: {
              '^/api': '',//重写,
          }
      }
  },
  }
}