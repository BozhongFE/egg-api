function checkType(data, type) {
  return Object.prototype.toString.call(data).indexOf(type) >= 0;
}
function isArray(data) {
  return checkType(data, 'Array');
}
function isObject(data) {
  return checkType(data, 'Object');
}
function isUndefined(data) {
  return checkType(data, 'Undefined');
}
function isTypeNum(val) {
  return /number|int/.test(val);
}
function paramFormatByRule(rule, data) {
  // 深层次数据格式异常修正, 如 param[0][enum][0][version][0].scheme => param[0].enum[0].version[0]['[scheme]']
  for (const key in data) {
    const hasBrackets = key.match(/^\[(.+)\]$/);
    if (hasBrackets && hasBrackets.length >= 2) {
      data[hasBrackets[1]] = data[key];
      delete data[key];
    }
  }
  for (const key in rule) {
    const item = rule[key];
    const dataItem = data[key];
    if (item) {
      // 数字强制格式化位数字类型
      if (isTypeNum(item) || isTypeNum(item.type) || isTypeNum(item.subtype)) {
        if (dataItem && /^[0-9]+$/.test(dataItem)) {
          data[key] = Number(dataItem);
        }
      }
      if ((item.type === 'array' || isTypeNum(item.itemType)) && dataItem) {
        data[key] = dataItem.map(subitem => {
          if (/^[0-9]+$/.test(subitem)) {
            return Number(subitem);
          }
          return subitem;
        });
      }
      // 对数组内部对象进行二次格式化
      if (item.type === 'array' && item.itemType === 'object' && isObject(item.rule) && isArray(dataItem)) {
        dataItem.forEach(subitem => {
          paramFormatByRule(subitem, item.rule);
        });
      }
      if (item.type === 'boolean' && (data[key] === 'false' || data[key] === 'true')) {
        data[key] = data[key] === 'true';
      }
      if (!isUndefined(item.default) && isUndefined(dataItem)) {
        data[key] = item.default;
      }
    }
    if (key === 'page') {
      data[key] = data[key] || 1;
    }
    if (key === 'limit') {
      data[key] = data[key] || 10;
    }
  }
}

class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  async didReady() {
    if (this.app.validator) {
      const validate = this.app.validator.validate;
      const self = this;

      this.app.validator.validate = function(rule, data) {
        paramFormatByRule(rule, data);
        return validate.apply(self.app.validator, [rule, data]);
      }
    }
  }
}
module.exports = AppBootHook