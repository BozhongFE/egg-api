const { types: { isNativeError } } = require('util');

module.exports = {
  /**
   * 自动处理接口返回数据
   * @param {*} code 错误编码，默认0正常，>0错误
   * @param {*} data 业务内容、异常内容、Error错误
   */
  auto(code, data) {
    const ctx = this;
    const config = this.app.config.api;
    if (isNativeError(data)) {
      data = String(data).replace('Error: ', '');
      code = code === 0 ? 1000 : code;
    }

    const json = {
      [config.errnoField]: code === 0 ? 0 : config.defaultErrno,
    };
    if (code === 0) {
      json.data = data;
    } else if (data[0] && data[0].field) {
      // validate errors
      json[config.errmsgField] = `${data[0].field} ${data[0].code}: ${data[0].message}`;
    } else {
      json[config.errmsgField] = data;
    }
    ctx.body = json;
  },
};
