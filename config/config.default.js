module.exports = () => {
  return {
    api: {
      debug: false,
      // 支持此插件的 controller 目录
      controller: ['/api'],
      // 配置路由
      router: {},
      // 接口返回值属性
      errnoField: 'error_code',
      errmsgField: 'error_message',
      defaultErrno: 1000,
    },
  };
}