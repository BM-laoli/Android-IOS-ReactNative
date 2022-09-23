const path = require("path");
const { hasBuildInfo, writeBuildInfo } = require("./utils");

function createModuleIdFactory() {
  const fileToIdMap = new Map();
  let nextId = 0;

  // 如果是业务 模块请以 10000000 来自增命名
  return (path) => {
    let id = fileToIdMap.get(path);

    if (typeof id !== "number") {
      id = nextId++;
      fileToIdMap.set(path, id);

      !hasBuildInfo(path) && writeBuildInfo(path, fileToIdMap.get(path));
    }

    return id;
  };
}

module.exports = {
  serializer: {
    createModuleIdFactory: createModuleIdFactory, // 给 bundle 一个id 避免冲突 cli 源码中这个id 是从1 开始 自增的
  },
};
