  文件夹下的 base config 和 mian config 属于 正在 研究的 common 和  business 方案, package 也属于此

## 目前已经分析完毕，完成了 bundle 的拆分接下里的问题是 如何在runtime 的 组装他们

base

```js
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

```

main

```js
const pathSep = require("path").sep;

function postProcessModulesFilter(module) {
  //返回false则过滤不编译
  // console.log('buz postProcessModulesFilter : ' + JSON.stringify(module));
  if (module["path"].indexOf("__prelude__") >= 0) {
    return false;
  }
  // 提前过滤依赖
  if (module["path"].indexOf(pathSep + "node_modules" + pathSep) > 0) {
    return false;
  }
  if (module["path"].indexOf(pathSep + "src" + pathSep) > 0) {
    return true;
  }
  if (module["path"].indexOf(pathSep + "common" + pathSep) > 0) {
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
    // console.log('buz createModuleIdFactory path : '+ path);
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
    console.log("buz createModuleIdFactory : " + name);
    return name;
  };
}

module.exports = {
  serializer: {
    createModuleIdFactory: createModuleIdFactory,
    processModuleFilter: postProcessModulesFilter,
    /* serializer options */
  },
};

```

```json
  "scripts": {
    "start": "react-native start --port=8082 ",
    "build:base": "react-native bundle --platform android --dev false --entry-file ./base.js --bundle-output ./android/app/src/main/assets/common.android.bundle --assets-dest ./android/app/src/main/res --config ./metro.base.config.js --reset-cache",
    "build:main": "react-native bundle --platform android --dev false --entry-file ./index.js --bundle-output ./android/app/src/main/assets/index.android.bundle --assets-dest ./android/app/src/main/res/ --config ./metro.main.config.js",
    "build:bu1": "react-native bundle --platform android --dev false --entry-file ./src/modules/Business1/main.js --bundle-output ./android/app/src/main/assets/bu1.android.bundle --assets-dest ./android/app/src/main/res/ --config ./metro.main.config.js --minify false",
    "build:bu2": "react-native bundle --platform android --dev false --entry-file ./src/modules/Business2/main.js --bundle-output ./android/app/src/main/assets/bu2.android.bundle --assets-dest ./android/app/src/main/res/ --config ./metro.main.config.js --minify false"
  },
```
