const assert = require('assert');

/**
 * 工具：找到每个路由对应的中间件
 * @param {*} pathname 
 * @param {*} app 
 */
function getMiddleware(pathname, app) {
  if (!app.config.api || !app.config.api.router) return [];
  const middleware = [];
  for (const item of app.config.api.router) {
    if (item.pathMatch && new RegExp(item.pathMatch).test(pathname)) {
      const itemMiddleware = item.middleware || [];
      if (item.isCoverMiddleware) middleware.splice(0, middleware.length, ...itemMiddleware);
      else middleware.push(...itemMiddleware);
    }
  }
  return middleware;
}

/**
 * 工具：找到每个路由对应的controller
 * @param {path} pathname 路由地址，例如：/api/user => controller.api.user
 * @param {controller} controller 
 */
function getController(pathname, controller) {
  const arr = pathname.split('/').filter(item => item);
  if (arr.length === 0) return null;
  return arr.reduce((total, item) => total[item], controller);
}

module.exports = (app) => {
  const middlewareMap = {};
  const { router, controller, logger, config } = app;
  if (!config.api || !config.api.controller || config.api.controller.length === 0) {
    return null;
  }
  // debug 日志
  const debug = config.api ? config.api.debug : false;

  /**
   * 定义单个路由
   * @param {string} method 接口方法：'get', 'post', 'delete', 'put', 'options', 'patch', 'del'
   * @param {patch-match} pathMatch 路由 URL 路径，参考 https://eggjs.org/zh-cn/basics/router.html
   * @param {controller} apiController controller
   * @param {string} apiControllerName controller路径，例如：controller.api.user.info
   */
  function defineRouter(method, pathMatch, apiController, apiControllerName) {
    const middleware = getMiddleware(pathMatch, app);
    const middlewareInstance = middleware.map(key => {
      assert(app.middlewares[key], `找不到 ${key} 中间件`);
      if (!middlewareMap[key]) middlewareMap[key] = app.middlewares[key](config[key]);
      return middlewareMap[key];
    });
    if (debug) {
      const middlewareLog = middleware.length > 0 ? ` => [middleware](${middleware})` : '';
      logger.debug(`[egg-api] [router] ${method.toUpperCase()} ${pathMatch}${middlewareLog} => ${apiControllerName}`);
    }
    router[method](pathMatch, ...middlewareInstance, apiController);
  }

  /**
   * 定义多层路由
   * @param {string} rootPath 当前根路由目录路径
   * @param {*} apiController controller
   * @param {*} apiControllerName controller路径，例如：controller.api.user.info
   */
  function defineRouterDeep(rootPath, apiController, apiControllerName) {
    for (const method in apiController) {
      if (typeof apiController[method] === 'function') {
        // 接口函数，配置路由
        if (['get', 'post', 'delete', 'put', 'options', 'patch', 'del'].indexOf(method) >= 0) {
          const pathMatch = `${rootPath.replace(/\/index$/, '')}.json`;
          defineRouter(method, pathMatch, apiController[method], apiControllerName);
        }
      } else {
        // 下级目录，继续遍历
        const directory = method;
        defineRouterDeep(`${rootPath}/${directory}`, apiController[directory], `${apiControllerName}.${directory}`);
      }
    }
  }
  

  for (const item of config.api.controller) {
    if (!/(\/[a-z0-9]+)+/.test(item)) {
      logger.warn(`[egg-api] [config.controller] controller配置的格式不对: ${item}，例如：/api/user`);
      return null;
    }
    const apiController = getController(item, controller);
    if (!apiController) {
      logger.warn(`[egg-api] [egg.controller] 不存在 controller${item.replace(/\//g, '.')}`);
      continue;
    }
    // 定义已存在接口路由
    defineRouterDeep(item, apiController, `controller${item.replace(/\//g, '.')}`);
    // 不存在的走异常路由
    if (controller.error && controller.error.notFound) {
      defineRouter('all', `${item}/*.json`, controller.error.notFound, 'controller.error.notFound');
    }
  }
}