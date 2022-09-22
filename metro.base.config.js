const pathSep = require("path").sep;

function postProcessModulesFilter(module) {
  //返回false则过滤不编译
  console.log("buz postProcessModulesFilter : " + JSON.stringify(module));
  if (module["path"].indexOf("__prelude__") >= 0) {
    return false;
  }
  // 提前过滤依赖
  if (module["path"].indexOf(pathSep + "node_modules" + pathSep) > 0) {
    return true;
  }
  if (module["path"].indexOf("index") > 0) {
    return true;
  }
  return false;
}

function createModuleIdFactory() {
  const projectRootPath = __dirname;
  return (path) => {
    // console.log("buz createModuleIdFactory path : " + path);
    let name = "";
    if (
      path.indexOf(
        "node_modules" +
          pathSep +
          "react-native" +
          pathSep +
          "Libraries" +
          pathSep
      ) > 0
    ) {
      name = path.substr(path.lastIndexOf(pathSep) + 1);
    } else if (path.indexOf(projectRootPath) == 0) {
      name = path.substr(projectRootPath.length + 1);
    }
    name = name.replace(".js", "");
    name = name.replace(".png", "");
    const regExp =
      pathSep == "\\" ? new RegExp("\\\\", "gm") : new RegExp(pathSep, "gm");
    name = name.replace(regExp, "_"); //把path中的/换成下划线
    // console.log("buz createModuleIdFactory : " + name);
    return name;
  };
}

module.exports = {
  serializer: {
    createModuleIdFactory: createModuleIdFactory, // 给 bundle 一个id 避免冲突 cli 源码中这个id 是从1 开始 自增的
    processModuleFilter: postProcessModulesFilter, // 返回false 就不会build 进去
  },
};
