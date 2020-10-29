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

## 插件配置项

```js
config.api = {
  // debug: 输出路由走向
  debug: false,
  // 支持此插件的 controller 目录（格式：/xxx or /xxx/xxx）
  controller: ['/api'],
  // 扩展路由功能，下面详细介绍
  router: [],
  // 接口返回值属性
  errnoField: 'error_code',
  errmsgField: 'error_message',
  defaultErrno: 1000,
}
```

### router
扩展路由功能，按顺序遍历匹配值（目前支持中间件）

+ 类型：`array[routerMatch]`
  + routerMatch： 类型 `{ pathMatch, middleware, isCoverMiddleware }`
    + pathMatch：类型 `string` 用来匹配 url 路径
    + middleware：类型：`array` 每次 pathMatch 匹配成功，追加当前中间件
    + isCoverMiddleware：类型 `boolean` 为 true 时，覆盖中间件，默认为 false

```js
config.api = {
  router: [
    /*
      所有 /api 开头的接口，都使用登录中间件
      /api* => middleware[isLogin] => controller.api.*
    */
    {
      pathMatch: '/api',
      middleware: ['isLogin']
    },
    /*
      部分接口需要追加其他中间件
      /api/collect* => middleware[isLogin, collect] => controller.api.collect.*
    */
    {
      pathMatch: '/api/collect',
      middleware: ['collect']
    },
    /*
      外部接口不需要登录，配置 isCoverMiddleware 即可
      /api/webhook.json => middleware[] => controller.api.webhook
    */
    {
      pathMatch: '/api/webhook.json',
      isCoverMiddleware: true,
    },
    /*
      外部接口不需要前面中间件，并且使用自己特定中间件
      /api/map.json => middleware[] => controller.api.map
    */
    {
      pathMatch: '/api/map.json',
      middleware: ['map'],
      isCoverMiddleware: true,
    },
  ]
}
```
