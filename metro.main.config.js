const { hasBuildInfo, writeBuildInfo, getCacheFile } = require("./utils");

function postProcessModulesFilter(module) {
  if (hasBuildInfo(module.path)) {
    return false;
  }

  return true;
}

// 不要使用 string 会导致 bundle 体积陡增
function createModuleIdFactory() {
  // 如果是业务 模块请以 10000000 来自增命名
  const fileToIdMap = new Map();
  let nextId = 10000000;

  return (path) => {
    if (Boolean(getCacheFile(path))) {
      return getCacheFile(path);
    }

    let id = fileToIdMap.get(path);

    if (typeof id !== "number") {
      id = nextId++;
      fileToIdMap.set(path, id);
      // !hasBuildInfo(path) && writeBuildInfo(path, fileToIdMap.get(path));
    }
    return id;
  };
}

module.exports = {
  serializer: {
    createModuleIdFactory: createModuleIdFactory, // 给 bundle 一个id 避免冲突 cli 源码中这个id 是从1 开始 自增的
    processModuleFilter: postProcessModulesFilter, // 返回false 就不会build 进去
  },
};
