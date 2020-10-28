# 约定式路由

基于 `eggjs` 的约定式路由插件，路由免配置，上手即可开发业务

## 安装

```bash
npm i @bz/egg-api
```

## 使用方式

+ 开启插件 `config/plugin.js`
```js
exports.ucenter = {
  api: {
    enable: true,
    package: '@bz/egg-api'
  }
}
```

## 方法注入

### ctx.auto(code, data/msg) 自动格式化接口返回内容

+ 参数
  + {number} code 错误编码，0为正常，>0异常
  + {string | error} data/errmsg 返回内容/异常格式内容，异常内容用 new Error(errmsg);

+ 用法

  返回接口内容
  ```js
  // 正常返回
  ctx.auto(0, {
    count: 0,
    list: [],
  });
  {
    "error_code": 0,
    "data": {
      "count": 0,
      "list": []
    }
  }

  // 返回普通错误
  ctx.auto(901, '用户未登录');
  {
    "error_code": 901,
    "error_message": "用户未登录"
  }

  // 返回异常错误
  ctx.auto(1234, new Error('参数不正确'));
  {
    "error_code": 1234,
    "error_message": "参数不正确"
  }

  // 返回异常错误（code为0时，会使用默认错误编码1000）
  ctx.auto(0, new Error('参数不正确'));
  {
    "error_code": 1000,
    "error_message": "参数不正确"
  }
  ```

## 约定式路由

目录文件即接口
默认使用 controller 目录下的 api 目录当作接口路由

`method` `/api/user.json` => `controller.api.user.[method]`

```js
// 默认方式
GET /api/user.json => controller.api.user.get
POST /api/user.json => controller.api.user.post
PUT /api/user.json => controller.api.user.put
DELETE /api/user.json => controller.api.user.delete

// 自动兼容 index.js 文件
GET /api/user.json => controller.api.user.index.get
GET /api/user/info.json => controller.api.user.info.get
```