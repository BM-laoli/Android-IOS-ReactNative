# 介绍

为了实现和探究ReactNative的分包功能，以及构建一个 相对从性能上 和 技术上都比较ok 的项目架构 而存在的一个库。你可以把它理解为一个 App的技术架构 方案。

# 重要细节（Android）

## 按照官方的教程踩坑的地方

1.1  注意集成的时候 和 发build 的时候 权限问题
  
  你需要注意的点 **权限问题**，**Error调试弹出层Activey**，**Http在deb模式i下是否安全的问题**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.example.myapprnn">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    


    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyappRNN"
        android:usesCleartextTraffic="true"
        tools:targetApi="31">
        <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />
        <activity
            android:name=".MainActivity"
            android:theme="@style/Theme.AppCompat.Light.NoActionBar"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>

```

1.2 onCreate 怎么样才是完整的？

> 实际上 在 官方的文档中  这里的代码是不完整的，比较全的代码在这里

```java
  @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
            }
        }

        SoLoader.init(this, false);

        mReactRootView = new ReactRootView(this);
        List<ReactPackage> packages = new PackageList(getApplication()).getPackages();
        // 有一些第三方可能不能自动链接，对于这些包我们可以用下面的方式手动添加进来：
        // packages.add(new MyReactNativePackage());
        // 同时需要手动把他们添加到`settings.gradle`和 `app/build.gradle`配置文件中。

        mReactInstanceManager = ReactInstanceManager.builder()
                .setApplication(getApplication())
                .setCurrentActivity(this)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModulePath("index")
                .addPackages(packages)
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();
        // 注意这里的MyReactNativeApp 必须对应"index.js"中的
        // "AppRegistry.registerComponent()"的第一个参数
        mReactRootView.startReactApplication(mReactInstanceManager, "MyReactNativeApp", null);

        setContentView(mReactRootView);

    }
```

2. build 的时候到底如何做呢？

```shell
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/com/your-company-name/app-package-name/src/main/assets/index.android.bundle --assets-dest android/com/your-company-name/app-package-name/src/main/res/
```

这个是官方给的shell  但实际上，对于我们的这个项目而言，它是这样构建的（等一下你问我怎么知道这样改是正确的？看RN的源码啦 弟弟，好吧有时间我会出一个文章来详解源码的细节）

```shell
react-native bundle --platform android --dev false --entry-file index.js --bundle-output ./android/app/src/main/assets/index.android.bundle --assets-dest ./android/app/src/main/res/
```

3. assets 资源在android 中到底如何进行的呢？

  通过分析原来的项目，发现都是build 的阶段 会生成一份固定的资源路径文件，这里是一份详细的流程说明 ，<https://juejin.cn/post/7113713363900694565，但是实际上打出来的包还是会在res>资源下 进行载入，文件的名称变化而已，对于常用的 build apk 包查看是否符合预期，可以尝试使用 反编译工具进行查看 🔧<https://cloud.tencent.com/developer/article/1904018>

   基于此建议业务包都采取http 加载资源

4. 关于native 模块的集成
  
  首先第一点要说明的就是 react-native 的cli 更新到9.x版本它不在支持 link ，什么意思呢？也就是说 “yarn react-native link xxx”会报错哈，
  
  我们这里选用 react-native-device-info 做native 模块来验证，是否可用, 有下面几点需要注意
  
- 9.x 下的cli 不需要link 只需要 yarn add 就完了 ，很方便
- 注意把 settings.gradle 中的配置改了 (7.x 的 gradle 的管理方式不一样！不改的话，会报错的哈)，注意要重载一下gradle ，**到此为止 你的Android Native 模块已经可以正常使用了**

  ```gradle
  dependencyResolutionManagement {
    // 注意这里 要去掉 请见一个 github 的issuss https://github.com/realm/realm-java/issues/7374 ，以及 7.0 下 gradle 的管理文档
    // repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
  ```

- 然后把 权限 加上 因为要读区mac 地址，所以 设备的wifi 权限要授予

  ```xml
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
  ```

  然后就用 TestNativeInfo.js 下的代码跑就好了。

## 重点 拆包方案

**要想完善拆包方案，就必须对包 和RN的运行原理有所了解**

1.1 说到拆包我们先了解 “包” 是什么， 由 什么组成

   一个 包 bundle 说白了 就说 一些js 代码，只不过后缀叫 bundle ，它实际上是一些js 代码，只不过这些代码的运行 环境在RN 提供的环境 不是在浏览器，通过这些代码RN 引擎可以使用 Native 组件 渲染 出你想要的UI ，好 这就是 包 bundle。

   一个rn 的bundle 主要由三部分构成

   1. 环境变量 和 require define 方法的预定义 （polyfills）

   2. 模块代码定义 （module define）

   3. 执行 （require 调用）

1.2 从一个简单的 RNDemo 分析 一个 简单的bundle 的构建

  在根目录 下有一个RNDemo =>

  ```js
import { StyleSheet, Text, View, AppRegistry } from "react-native";

// 整个App 的骨架，基础包 更新要严格控制
class BU1 extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.hello}>BU1 </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
 // -----省略
});

AppRegistry.registerComponent("Bu1Activity", () => BU1);
  ```

 执行build 之后 ，我们来分析bundle 嘛

 ```shell
yarn react-native bundle --platform android --dev false --entry-file ./RNDemo.js --bundle-output ./android/app/src/main/assets/rn.android.bundle --assets-dest ./android/app/src/main/res --minify false --reset-cache

# 上面有几个参数 --minify false 不要混淆，--reset-cache 清理缓存 具体的可以看 @react-native-community/cli 源代码
 ```

首先我们前面说过  个rn 的bundle 主要由三部分构成 （polyfills、defined、require ）

先看第一部分 polyfills 它从第 1行 一直到 第 799 行

 ```js
// 第一句话
var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now(),
    __DEV__=false,
    process=this.process||{},
    __METRO_GLOBAL_PREFIX__='';
    process.env=process.env||{};
    process.env.NODE_ENV=process.env.NODE_ENV||"production";
//可以看到 它定义了 运行时的基本环境变量 __BUNDLE_START_TIME__、__DEV__、__METRO_GLOBAL_PREFIX__..... 其作用是给RN 的Native 容器识别的 ，我们这里不深入，你只需要 知道没有这个 RN 的Native 容器识别会异常！ 报错闪退


// 解析来 是三个闭包立即执行 函数 ，重点是第一个 它定义了 __r ,__d, 这两个函数 就说后面 模块定义 和 模块执行的关键函数
global.__r = metroRequire;
global[__METRO_GLOBAL_PREFIX__ + "__d"] = define;
metroRequire.packModuleId = packModuleId;
var modules = clear();
function clear() {
  modules = Object.create(null);
  return modules;
}
var moduleDefinersBySegmentID = [];
var definingSegmentByModuleID = new Map();

// 下面的说 __r  的主要定义  
 function metroRequire(moduleId) {
    var moduleIdReallyIsNumber = moduleId;
    var module = modules[moduleIdReallyIsNumber];
    return module && module.isInitialized ? module.publicModule.exports : guardedLoadModule(moduleIdReallyIsNumber, module);
  }
  // 可以看到上述函数 的作用是 从 module（在下称它为 模块组册表 ）看看 是否已经初始化 了 ，如果是 就导出 （exports） 如果没有就 加载一次 （guardedLoadModule）

  function guardedLoadModule(moduleId, module) {
    if (!inGuard && global.ErrorUtils) {
      inGuard = true;
      var returnValue;

      try {
        returnValue = loadModuleImplementation(moduleId, module);
      } catch (e) {
        global.ErrorUtils.reportFatalError(e);
      }

      inGuard = false;
      return returnValue;
    } else {
      return loadModuleImplementation(moduleId, module);
    }
  }
  // 上述函数 最重要的事情 就是 执行 loadModuleImplementation 函数，传递 moduleId 和 module 


  function loadModuleImplementation(moduleId, module) {
    if (!module && moduleDefinersBySegmentID.length > 0) {
      var _definingSegmentByMod;

      var segmentId = (_definingSegmentByMod = definingSegmentByModuleID.get(moduleId)) !== null && _definingSegmentByMod !== undefined ? _definingSegmentByMod : 0;
      var definer = moduleDefinersBySegmentID[segmentId];

      if (definer != null) {
        definer(moduleId);
        module = modules[moduleId];
        definingSegmentByModuleID.delete(moduleId);
      }
    }

    var nativeRequire = global.nativeRequire;

    if (!module && nativeRequire) {
      var _unpackModuleId = unpackModuleId(moduleId),
          _segmentId = _unpackModuleId.segmentId,
          localId = _unpackModuleId.localId;

      nativeRequire(localId, _segmentId);
      module = modules[moduleId];
    }

    if (!module) {
      throw unknownModuleError(moduleId);
    }

    if (module.hasError) {
      throw moduleThrewError(moduleId, module.error);
    }

    module.isInitialized = true;
    var _module = module,
        factory = _module.factory,
        dependencyMap = _module.dependencyMap;

    try {
      var moduleObject = module.publicModule;
      moduleObject.id = moduleId;
      factory(global, metroRequire, metroImportDefault, metroImportAll, moduleObject, moduleObject.exports, dependencyMap);
      {
        module.factory = undefined;
        module.dependencyMap = undefined;
      }
      return moduleObject.exports;
    } catch (e) {
      module.hasError = true;
      module.error = e;
      module.isInitialized = false;
      module.publicModule.exports = undefined;
      throw e;
    } finally {}
  }
// 上述 重要的函数就是  factory(global, metroRequire, metroImportDefault, metroImportAll, moduleObject, moduleObject.exports, dependencyMap); 。它复杂执行模块的代码 ，好了 到这里为止我们就够了，现在不用分析太深入，要特别注意的是 factory  不是 定义好的函数，而是传入 的函数 ！ factory = _module.factory, 具体点来说，它的执行是依据每个模块 的传入参数来执行的


// 然后我们来看看 __d define  ，这个东西就比较的简单了
function define(factory, moduleId, dependencyMap) {
    if (modules[moduleId] != null) {
      return;
    }

    var mod = {
      dependencyMap: dependencyMap,
      factory: factory,
      hasError: false,
      importedAll: EMPTY,
      importedDefault: EMPTY,
      isInitialized: false,
      publicModule: {
        exports: {}
      }
    };
    modules[moduleId] = mod;
  }
  // 可以看到这个非常的简单，就是在 组册表（modules）中 添加 对应的 模块 

 ```

我们再来看看 重要的 一个 module 的定义是如何实现的

```js
// 为了方便起见 我们直接找到  BU1 组件的声明  通过全局搜索🔍 我们找到了这个 定义，他在 802 -> 876 行

// 我们先看他 __d 参数部分 ,它 的执行器 factory = fn，模块id = 0 ， 依赖模块的Map（别的依赖模块的 moduleId） = [1,2,3,4,6,9,10,12,179]
__d(fn,0,[1,2,3,4,6,9,10,12,179]) 

__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = _$$_REQUIRE(_dependencyMap[0]);

  var _classCallCheck2 = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[1]));

  var _createClass2 = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[2]));

  var _inherits2 = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[3]));

  var _possibleConstructorReturn2 = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[4]));

  var _getPrototypeOf2 = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[5]));

// 下面三个模块 是 react -> react-native -> jsxRuntime 的重要模块 ！分包负责 核心加载 RN 以来，JSXruntime 解析 
  var _react = _interopRequireDefault(_$$_REQUIRE(_dependencyMap[6]));

  var _reactNative = _$$_REQUIRE(_dependencyMap[7]);

  var _jsxRuntime = _$$_REQUIRE(_dependencyMap[8]);

  function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

  function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

// BU1 组件编译后的渲染就是 这一坨
  var BU1 = function (_React$Component) {
    (0, _inherits2.default)(BU1, _React$Component);

    var _super = _createSuper(BU1);

    function BU1() {
      (0, _classCallCheck2.default)(this, BU1);
      return _super.apply(this, arguments);
    }

    (0, _createClass2.default)(BU1, [{
      key: "render",
      value: function render() {
        return (0, _jsxRuntime.jsx)(_reactNative.View, {
          style: styles.container,
          children: (0, _jsxRuntime.jsx)(_reactNative.Text, {
            style: styles.hello,
            children: "BU1 "
          })
        });
      }
    }]);
    return BU1;
  }(_react.default.Component);

// 我们自己写的styles 函数
  var styles = _reactNative.StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      height: 100
    },
    hello: {
      fontSize: 20,
      textAlign: "center",
      margin: 10
    },
    imgView: {
      width: "100%"
    },
    img: {
      width: "100%",
      height: 600
    },
    flatContainer: {
      flex: 1
    }
  });

// RNDemo 的 registerComponent 函数 
  _reactNative.AppRegistry.registerComponent("Bu1Activity", function () {
    return BU1;
  });
},0,[1,2,3,4,6,9,10,12,179]);

```

最后 就是RNDemo 的__r 执行了

```js

__r(27);
// 27 这个模块id 我们可以去看看它在做什么
__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  'use strict';

  var start = Date.now();

  _$$_REQUIRE(_dependencyMap[0]);

  _$$_REQUIRE(_dependencyMap[1]);

  _$$_REQUIRE(_dependencyMap[2]);

  _$$_REQUIRE(_dependencyMap[3]);

  _$$_REQUIRE(_dependencyMap[4]);

  _$$_REQUIRE(_dependencyMap[5]);

  _$$_REQUIRE(_dependencyMap[6]);

  _$$_REQUIRE(_dependencyMap[7]);

  _$$_REQUIRE(_dependencyMap[8]);

  _$$_REQUIRE(_dependencyMap[9]);

  _$$_REQUIRE(_dependencyMap[10]);

  _$$_REQUIRE(_dependencyMap[11]); 

  var GlobalPerformanceLogger = _$$_REQUIRE(_dependencyMap[12]);

  GlobalPerformanceLogger.markPoint('initializeCore_start', GlobalPerformanceLogger.currentTimestamp() - (Date.now() - start));
  GlobalPerformanceLogger.markPoint('initializeCore_end');
},27,[28,29,30,32,56,62,65,70,101,105,106,116,78]);

// 这个 模块，可以这样理解，它实际上是 在执行 initializeCore_start，初始化的工作 initializeCore，预载入一些系统 模块 


// 直接就是执行 RNDemo 1 的模块代码了 具体的细节这里就不说了，核心就是 执行 模块中 的factory 代码 既__d 的第一个参数fn 
__r(0);
```

1.3 从 刚才的demo 我们来看 metro 的打包工作流

我们了解完 bundle 的生成之后，不妨陷入了一个思考 🤔  这些模块id 如何生成的呢？

  首先我们看命了行

```ts
yarn react-native bundle 
     --platform android 
     --dev false 
     --entry-file ./RNDemo.js 
     --bundle-output ./android/app/src/main/assets/rn.android.bundle 
     --assets-dest ./android/app/src/main/res 
     --minify false 
     --reset-cache
// 我们不妨找一下 react-native cli 的源码 它位于/node_modules/bin 下的目录（为什么是bin 目录？你对node 不熟悉，请去补充一下node 相关的知识） 

'use strict';
var cli = require('@react-native-community/cli');
if (require.main === module) {
  cli.run();
}
module.exports = cli;

// 可以看到 实际上就是执行 @react-native-community/cli 里的 cli 
// 然后我们去看看 官方，仓库源代码 仓库里有一份清晰的文档说明，详细的描述里 每个参数的作用 ，这里不详细的解了 

// 我们找到源代码仓库 .cli/ 里面有一个bin bin 里有一个run ，run 函数定义在 index 中

async function run() {
  try {
    await setupAndRun();
  } catch (e) {
    handleError(e);
  }
}

async function setupAndRun() {
  ....
  // 重点函数  从 detachedCommands 添加更多的 command
  for (const command of detachedCommands) {
    attachCommand(command);
  }
  ....
}

// command 在 commands index 中 于是我们发现了 
import {Command, DetachedCommand} from '@react-native-community/cli-types';
import {commands as cleanCommands} from '@react-native-community/cli-clean';
import {commands as doctorCommands} from '@react-native-community/cli-doctor';
import {commands as configCommands} from '@react-native-community/cli-config';
import {commands as metroCommands} from '@react-native-community/cli-plugin-metro';

import profileHermes from '@react-native-community/cli-hermes';
import upgrade from './upgrade/upgrade';
import init from './init';

export const projectCommands = [
  ...metroCommands,
  ...configCommands,
  cleanCommands.clean,
  doctorCommands.info,
  upgrade,
  profileHermes,
] as Command[];

export const detachedCommands = [
  init,
  doctorCommands.doctor,
] as DetachedCommand[];


// 我们找到 cli-plugin-metro 是我们需要的因为 在其文件夹下 我们发现了start 和bundle 两个command 
// 解析来 我们找到了它的调用链
import Server from 'metro/src/Server';

 const server = new Server(config);

  try {
    const bundle = await output.build(server, requestOpts);

    await output.save(bundle, args, logger.info);
  }

// 然后我们来看 Server  metro 仓库的 Server 中 
class Server {
 constructor(config, options) {
    this._config = config;
    this._serverOptions = options;

    if (this._config.resetCache) {
      this._config.cacheStores.forEach((store) => store.clear());

      this._config.reporter.update({
        type: "transform_cache_reset",
      });
    }

    this._reporter = config.reporter;
    this._logger = Logger;
    this._platforms = new Set(this._config.resolver.platforms);
    this._isEnded = false; // TODO(T34760917): These two properties should eventually be instantiated
    // elsewhere and passed as parameters, since they are also needed by
    // the HmrServer.
    // The whole bundling/serializing logic should follow as well.

    
    this._createModuleId = config.serializer.createModuleIdFactory();
    this._bundler = new IncrementalBundler(config, {
      hasReducedPerformance: options && options.hasReducedPerformance,
      watch: options ? options.watch : undefined,
    });
    this._nextBundleBuildID = 1;
  }
  //....

    // 诶 重点代码 _createModuleId ，创建 ModuleId 但 它从那儿来呢？我们回到执行的地方 @react-native-community/的 cli-plugin-metro中 找到 buildBundle， 它就是命令 执行的地方
// 这个函数下 loadMetroConfig 返回一个config 我们看看 loadMetroConfig 在干什么
async function buildBundle(
  args: CommandLineArgs,
  ctx: Config,
  output: typeof outputBundle = outputBundle,
) {
  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  return buildBundleWithConfig(args, config, output);
}


export default function loadMetroConfig(
  ctx: ConfigLoadingContext,
  options?: ConfigOptionsT,
): Promise<MetroConfig> {
  const defaultConfig = getDefaultConfig(ctx);
  if (options && options.reporter) {
    defaultConfig.reporter = options.reporter;
  }
  // 发现这里有一个 loadConfig
  return loadConfig({cwd: ctx.root, ...options}, defaultConfig);
}

// loadConfig 从 metro 里 来 通过调用链我们锁定了 这行代码
const getDefaultConfig = require('./defaults');

// 它里面正好有一个

const defaultCreateModuleIdFactory = require('metro/src/lib/createModuleIdFactory');

// 然后我们先不阅读 具体内容，鉴于 爱metro 和 cli 中反复 跳 我们先理解metro 


```

首先我们在metro 官网找到了 相关的 build 构建流程 (<https://facebook.github.io/metro/docs/concepts>)。主要分下面几个阶段

- Resolution （依据入口文件 解析，他于Transformation 是并行的 ）
- Transformation （转换比如一些es6 的语法）
- Serialization （序列化，实际上moduleId 就是这个理生成的）组合成单个 JavaScript 文件的模块包。

```js
// metro 官方文档（https://facebook.github.io/metro/docs/configuration#serializer-options）中提到了 Serialization 时期使用到的几个函数，其中我们要关注的点是“moduleId 如何生成的 ”

// 具体的源代码在  ./node_modules/metro/src/lib/createModuleIdFactory.js 这里是metro 默认 的 moduleId 生成方式

function createModuleIdFactory() {
  const fileToIdMap = new Map();
  let nextId = 0;
  return (path) => {
    let id = fileToIdMap.get(path);

    if (typeof id !== "number") {
      id = nextId++;
      fileToIdMap.set(path, id);
    }

    return id;
  };
}

// 不难看出 非常的简单 就是0 开始的 自增，后面我们分包的时候 需要手动的定制一些 moduleId 要不然 运行的时候 会导致 模块的依赖出现问题 和冲突 导致闪退！

```

顺便说一下 Serialization时期 还有一个重要的函数 processModuleFilter，他可以完成模块 build 阶段的过滤，当他 返回 false 就是不打入，这个特性对我们后续的拆包会很有用。

**到此为止，我们对bundle 和 metro 的浅析接结束了，以上都是前置内容是了解后续拆包方案的 js部分的基础**

1.4 js基础部分我们掰开 说完整了，我们看看 RN 在Android 上的loading 原理

我们先梳理流程

```java

// 创建一个ReactRootView
 mReactRootView = new ReactRootView(this);

// 增加依赖
List<ReactPackage> packages = new PackageList(getApplication()).getPackages();
packages.add(new RNToolPackage());

// 创建 ReactInstanceManager 实例
mReactInstanceManager = ReactInstanceManager.builder()
          .setApplication(getApplication())
          .setCurrentActivity(this)
          .setBundleAssetName("index.android.bundle")
          .setJSMainModulePath("index") // 仅dev 下有效
          .addPackages(packages)
          .setUseDeveloperSupport(BuildConfig.DEBUG)
          .setInitialLifecycleState(LifecycleState.RESUMED)
          .build();

// 组册 js 组件 并挂到ReactRootView 实例上
mReactRootView.startReactApplication(mReactInstanceManager, "MyReactNativeApp", null);

// 把 mReactRootView 设置到当前的 View 上
setContentView(mReactRootView);
```

解析来我们浅析 每个调用链

```java
// 我们看看这个 ReactRootView 类 还有这个类的 startReactApplication 方法 
class ReactRootView extends FrameLayout implements RootView, ReactRoot {
  //..... 省去部分代码

  // 可以看到它继承 FrameLayout ，并且实现了 两个借口，
    @ThreadConfined("UI")
    public void startReactApplication(ReactInstanceManager reactInstanceManager, String moduleName, @Nullable Bundle initialProperties, @Nullable String initialUITemplate) {
        Systrace.beginSection(0L, "startReactApplication");

        try {
            UiThreadUtil.assertOnUiThread();
            Assertions.assertCondition(this.mReactInstanceManager == null, "This root view has already been attached to a catalyst instance manager");
            // 看看 mReactInstanceManager 实例是否正常 加载

            // 赋值 
            this.mReactInstanceManager = reactInstanceManager;
            this.mJSModuleName = moduleName; // 用上面的例子来说 这个地方的值 就是 MyReactNativeApp
            this.mAppProperties = initialProperties;
            this.mInitialUITemplate = initialUITemplate;

            // 创建 jscore 基础容器 上下午
            this.mReactInstanceManager.createReactContextInBackground();

            if (ReactFeatureFlags.enableEagerRootViewAttachment) {
                if (!this.mWasMeasured) {
                    // 适配屏幕
                    this.setSurfaceConstraintsToScreenSize();
                }
                // 简单的理解就是 让这个RootView 和 reactInstanceManager 关联起来 这一步上是rn 容器的基础
                // 一些js 通信view 渲染的都在这个里面 由 reactInstanceManager 管理
                this.attachToReactInstanceManager();
            }

        } finally {
            Systrace.endSection(0L);
        }

    }


    private void attachToReactInstanceManager() {
      Systrace.beginSection(0L, "attachToReactInstanceManager");
      ReactMarker.logMarker(ReactMarkerConstants，ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_START);
      if (this.getId() != -1) {
            ReactSoftExceptionLogger.logSoftException("ReactRootView", new IllegalViewOperationException("Trying to attach a ReactRootView with an explicit id already set to [" + this.getId() + "]. React Native uses the id field to track react tags and will overwrite this field. If that is fine, explicitly overwrite the id field to View.NO_ID."));
        }

        try {
            if (!this.mIsAttachedToInstance) {
                this.mIsAttachedToInstance = true;
                // 重点 ReactInstanceManager attachRootView 当前view 
                ((ReactInstanceManager)Assertions.assertNotNull(this.mReactInstanceManager)).attachRootView(this);
                
                // 执行 我们自己定义的监听器（详细见RCTDeviceEventEmitter 
                this.getViewTreeObserver().addOnGlobalLayoutListener(this.
                getCustomGlobalLayoutListener());
                return;
            }
        } finally {
            ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_END);
            Systrace.endSection(0L);
        }

    }

 }
 

// 这个内容比较简单 读取当前 application ，然后返回 package List 
List<ReactPackage> packages = new PackageList(getApplication()).getPackages();
// 如果还需要其它package 可以接着add 
packages.add(new RNToolPackage());

// PackageList class 
public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  private MainPackageConfig mConfig;

  ...
  public PackageList(Application application) {
    this(application, null);
  }

  public ArrayList<ReactPackage> getPackages() {
    return new ArrayList<>(Arrays.<ReactPackage>asList(
      new MainReactPackage(mConfig),
      new AsyncStoragePackage(),
      new RNDeviceInfo()
    ));
  }
}



//  我们来看这个 
mReactInstanceManager = ReactInstanceManager.builder()
          .setApplication(getApplication())
          .setCurrentActivity(this)
          .setBundleAssetName("index.android.bundle")
          .setJSMainModulePath("index") // 仅dev 下有效
          .addPackages(packages)
          .setUseDeveloperSupport(BuildConfig.DEBUG)
          .setInitialLifecycleState(LifecycleState.RESUMED)
          .build();


class ReactInstanceManager  {
    public static ReactInstanceManagerBuilder builder() {
        return new ReactInstanceManagerBuilder();
    }

    // 构造函数
    ReactInstanceManager(..../* 太多了省去不写 后面有说明 */){
        // 这两个function 不是我们讨论的重点 省去
        initializeSoLoaderIfNecessary(applicationContext);// 
        DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(applicationContext);

        this.mApplicationContext = applicationContext;
        this.mCurrentActivity = currentActivity;
        this.mDefaultBackButtonImpl = defaultHardwareBackBtnHandler;
        this.mJavaScriptExecutorFactory = javaScriptExecutorFactory;
        this.mBundleLoader = bundleLoader;
        this.mJSMainModulePath = jsMainModulePath; // 只有在dev 的时候有用
        this.mPackages = new ArrayList();
        this.mUseDeveloperSupport = useDeveloperSupport;
        this.mRequireActivity = requireActivity;
        Systrace.beginSection(0L, "ReactInstanceManager.initDevSupportManager");
        
        // dev 模式下 才使用 mJSMainModulePath
        this.mDevSupportManager = devSupportManagerFactory.create(applicationContext, this.createDevHelperInterface(), this.mJSMainModulePath, useDeveloperSupport, redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers, surfaceDelegateFactory);

        Systrace.endSection(0L);
        this.mBridgeIdleDebugListener = bridgeIdleDebugListener;
        this.mLifecycleState = initialLifecycleState;
        this.mMemoryPressureRouter = new MemoryPressureRouter(applicationContext);
        this.mJSExceptionHandler = jSExceptionHandler;
        this.mTMMDelegateBuilder = tmmDelegateBuilder;
        
        // 开启线程执行载入 package 
        synchronized(this.mPackages) {
            PrinterHolder.getPrinter().logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: Use Split Packages");
            this.mPackages.add(new CoreModulesPackage(this, new DefaultHardwareBackBtnHandler() {
                public void invokeDefaultOnBackPressed() {
                    ReactInstanceManager.this.invokeDefaultOnBackPressed();
                }
            }, mUIImplementationProvider, lazyViewManagersEnabled, minTimeLeftInFrameForNonBatchedOperationMs));
            if (this.mUseDeveloperSupport) {
                this.mPackages.add(new DebugCorePackage());
            }

            this.mPackages.addAll(packages);
        }

        this.mJSIModulePackage = jsiModulePackage;
        ReactChoreographer.initialize();
        if (this.mUseDeveloperSupport) {
            this.mDevSupportManager.startInspector();
        }

        this.registerCxxErrorHandlerFunc();
    }

    // 是否创建 了 InitContext
    public boolean hasStartedCreatingInitialContext() {
          return this.mHasStartedCreatingInitialContext;
    }

    // 加一个监听器 看看 context 容器 实例 是否载入
    public void addReactInstanceEventListener(com.facebook.react.ReactInstanceEventListener listener) {
        this.mReactInstanceEventListeners.add(listener);
    }



}

class ReactInstanceManagerBuilder {
    ....
    ReactInstanceManagerBuilder() { // 指定一个JS 解释器
        this.jsInterpreter = JSInterpreter.OLD_LOGIC; 
        // JSInterpreter JS解释器，里面有三种模式 OLD_LOGIC，JSC，HERMES
    }

    // 为 ReactInstanceManagerBuilder 实例 设置当前 application
    public ReactInstanceManagerBuilder setApplication(Application application) {
        this.mApplication = application;
        return this;
    }

    // 为 ReactInstanceManagerBuilder 实例 设置当前 activity
    public ReactInstanceManagerBuilder setCurrentActivity(Activity activity) {
        this.mCurrentActivity = activity;
        return this;
    }

    // 设置当前 mJSBundleAssetUrl，此时 mJSBundleLoader = null 
    public ReactInstanceManagerBuilder setBundleAssetName(String bundleAssetName) {
        this.mJSBundleAssetUrl = bundleAssetName == null ? null : "assets://" + bundleAssetName;
        this.mJSBundleLoader = null;
        return this;
    }

   // 设置 mJSMainModulePath 这个只有在 dev 模式下有效，至于为什么 请看后面的一个源代码 --TODO
    public ReactInstanceManagerBuilder setJSMainModulePath(String jsMainModulePath) {
        this.mJSMainModulePath = jsMainModulePath;
        return this;
    }

   // 把 PackageList 全部添加到自己身上
    public ReactInstanceManagerBuilder addPackages(List<ReactPackage> reactPackages) {
        this.mPackages.addAll(reactPackages);
        return this;
    }

   // 设置是否dev 模式
    public ReactInstanceManagerBuilder setUseDeveloperSupport(boolean useDeveloperSupport) {
        this.mUseDeveloperSupport = useDeveloperSupport;
        return this;
    }

    // 设置是否生命周期 他说这些枚举 位于facebook 的包下
    // BEFORE_CREATE, 创建之前
    // BEFORE_RESUME, resume 之前
    // RESUMED;  已经 resume
    public ReactInstanceManagerBuilder setInitialLifecycleState(LifecycleState initialLifecycleState) {
        this.mInitialLifecycleState = initialLifecycleState;
        return this;
    }

    public ReactInstanceManager build() {
        Assertions.assertNotNull(this.mApplication, "Application property has not been set with this builder");
        if (this.mInitialLifecycleState == LifecycleState.RESUMED) {
            Assertions.assertNotNull(this.mCurrentActivity, "Activity needs to be set if initial lifecycle state is resumed");
        }

        Assertions.assertCondition(this.mUseDeveloperSupport || this.mJSBundleAssetUrl != null || this.mJSBundleLoader != null, "JS Bundle File or Asset URL has to be provided when dev support is disabled");
        Assertions.assertCondition(this.mJSMainModulePath != null || this.mJSBundleAssetUrl != null || this.mJSBundleLoader != null, "Either MainModulePath or JS Bundle File needs to be provided");
        
        // RN 的UI 提供者 
        if (this.mUIImplementationProvider == null) {
            this.mUIImplementationProvider = new UIImplementationProvider();
        }

        // 获取当前包名
        String appName = this.mApplication.getPackageName();
        String deviceName = AndroidInfoHelpers.getFriendlyDeviceName(); // 获取设备名称

        // 创建一个 ReactInstanceManager 
        return new ReactInstanceManager(
         this.mApplication,
         this.mCurrentActivity,
         this.mDefaultHardwareBackBtnHandler, // android 物理返回键处理程序 
         this.mJavaScriptExecutorFactory == null ? this.getDefaultJSExecutorFactory(appName, deviceName, this.mApplication.getApplicationContext()) : this.mJavaScriptExecutorFactory, 
         this.mJSBundleLoader == null && this.mJSBundleAssetUrl != null ? JSBundleLoader.createAssetLoader(this.mApplication, this.mJSBundleAssetUrl, false) : this.mJSBundleLoader, 
         //  mJSBundleLoader js bundle 捆绑器 详细见下面的类 
         this.mJSMainModulePath, 
         this.mPackages, 
         this.mUseDeveloperSupport,
          (DevSupportManagerFactory)(this.mDevSupportManagerFactory == null ? new DefaultDevSupportManagerFactory() : this.mDevSupportManagerFactory), 
         this.mRequireActivity, 
         this.mBridgeIdleDebugListener, (LifecycleState)Assertions.assertNotNull(this.mInitialLifecycleState, "Initial lifecycle state was not set"), 
         this.mUIImplementationProvider, 
         this.mJSExceptionHandler, 
         this.mRedBoxHandler, 
         this.mLazyViewManagersEnabled, // boolean 是否开启 lazy 加载
         this.mDevBundleDownloadListener,  // dev bundle 下载监听器
         this.mMinNumShakes, 
         this.mMinTimeLeftInFrameForNonBatchedOperationMs, 
         this.mJSIModulesPackage,  // ReactInstanceManager 里的 jsiModulePackage  这个 package 还和 rn 的bridge 有关 这里不深入
         this.mCustomPackagerCommandHandlers, 
         this.mTMMDelegateBuilder, 
         this.mSurfaceDelegateFactory);
    }

    // 工厂函数 js 执行器 看看到底给你的是 JSCExecutorFactory 还是 HermesExecutorFactory 
    private JavaScriptExecutorFactory getDefaultJSExecutorFactory(String appName, String deviceName, Context applicationContext) {
        if (this.jsInterpreter == JSInterpreter.OLD_LOGIC) {
            try {
                ReactInstanceManager.initializeSoLoaderIfNecessary(applicationContext);
                JSCExecutor.loadLibrary();
                return new JSCExecutorFactory(appName, deviceName);
            } catch (UnsatisfiedLinkError var5) {
                if (var5.getMessage().contains("__cxa_bad_typeid")) {
                    throw var5;
                } else {
                    HermesExecutor.loadLibrary();
                    return new HermesExecutorFactory();
                }
            }
        } else if (this.jsInterpreter == JSInterpreter.HERMES) {
            HermesExecutor.loadLibrary();
            return new HermesExecutorFactory();
        } else {
            JSCExecutor.loadLibrary();
            return new JSCExecutorFactory(appName, deviceName);
        }
    }

}

public abstract class JSBundleLoader {
    public JSBundleLoader() {
    }
    ....
    public static JSBundleLoader createAssetLoader(final Context context, final String assetUrl, final boolean loadSynchronously) {
        return new JSBundleLoader() {
            public String loadScript(JSBundleLoaderDelegate delegate) { // 重点参数 loadScriptFromAssets
                // 重点 这个就是 loadScriptFromAssets 的方法 。具体实现在 JSCExecutor.cpp 这里不详细扩开了，
                // 如果我们知道 rn 中谁在调用这个方法 就知道是如何载入js 的了
                delegate.loadScriptFromAssets(context.getAssets(), assetUrl, loadSynchronously);
                return assetUrl;
            }
        };
    }

    .....
    public abstract String loadScript(JSBundleLoaderDelegate var1);
    ....
}

// 当我们的步骤执行完之后 mReactInstanceManager 是一个这样的东西
mReactInstanceManager = {
  this.mApplication = "当前Application"
  this.mCurrentActivity   = "当前的Activity"
  this.mDefaultBackButtonImpl = "当前硬件返回处理程序"
  this.mJavaScriptExecutorFactory = "JSCExecutorFactory 执行器 appName =myrnApp deviceName 小米2s"
  this.mBundleLoader= "JSBundleLoader.createAssetLoader(this.mApplication, assets://index.android.bundle, false)  "
  this.mJSMainModulePath="index"
  this.mPackages="Packages 里面包含了dev 的一些包 因为UseDeveloperSupport = true"
  this.mUseDeveloperSupport="true"
  this.mRequireActivity="false"
  this.mBridgeIdleDebugListener="null"
  this.mJSExceptionHandler="null"
  this.mRedBoxHandler="null"
  this.mLazyViewManagersEnabled="false"
  this.mDevBundleDownloadListener="null"
  this.mMinNumShakes="1"
  this.mMinTimeLeftInFrameForNonBatchedOperationMs="-1"
  this.mJSIModulesPackage="null"
  this.mCustomPackagerCommandHandlers="{}"
  this.mTMMDelegateBuilder="null"
  this.mSurfaceDelegateFactory="null"
}

// 在 RootView 类中有一个 startApplication 方法 里面有一个  createReactContextInBackground 它属于 ReactInstanceManager 里面分治了两类 dev 和 release 的
class ReactInstanceManager {
  ....

    // 通过调用链 我们找到了最总的调用方法 recreateReactContextInBackgroundInner 和 runCreateReactContextOnNewThread 以及 createReactContext
    @ThreadConfined("UI")
    private void recreateReactContextInBackgroundInner() {
        FLog.d(TAG, "ReactInstanceManager.recreateReactContextInBackgroundInner()");
        PrinterHolder.getPrinter().logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: recreateReactContextInBackground");
        UiThreadUtil.assertOnUiThread();
        
        if (this.mUseDeveloperSupport && this.mJSMainModulePath != null) { //进入dev
            final DeveloperSettings devSettings = this.mDevSupportManager.getDevSettings();
            if (!Systrace.isTracing(0L)) {
                if (this.mBundleLoader == null) {
                    this.mDevSupportManager.handleReloadJS(); // reload js 
                } else {
                    this.mDevSupportManager.isPackagerRunning(new PackagerStatusCallback() {
                        public void onPackagerStatusFetched(final boolean packagerIsRunning) {
                            UiThreadUtil.runOnUiThread(new Runnable() {
                                public void run() {
                                    if (packagerIsRunning) {
                                        ReactInstanceManager.this.mDevSupportManager.handleReloadJS();
                                    } else if (ReactInstanceManager.this.mDevSupportManager.hasUpToDateJSBundleInCache() && !devSettings.isRemoteJSDebugEnabled() && !ReactInstanceManager.this.mUseFallbackBundle) {
                                        ReactInstanceManager.this.onJSBundleLoadedFromServer();
                                    } else {
                                        devSettings.setRemoteJSDebugEnabled(false);
                                        ReactInstanceManager.this.recreateReactContextInBackgroundFromBundleLoader();
                                    }

                                }
                            });
                        }
                    });
                }

                return;
            }
        }

      // 正常 release 如何 loader 呢？依据调用链 查找到 runCreateReactContextOnNewThread 函数
        this.recreateReactContextInBackgroundFromBundleLoader();
    }

    // 开启线程 执行 CreateReactContext 这里有很多的线程代码 我们不深入 
    @ThreadConfined("UI")
    private void runCreateReactContextOnNewThread(final ReactInstanceManager.ReactContextInitParams initParams) {
      ....
      reactApplicationContext = ReactInstanceManager.this.createReactContext(initParams.getJsExecutorFactory().create(), initParams.getJsBundleLoader());
      .....
      ReactInstanceManager.this.setupReactContext(reactApplicationContext); // 更新上去 
    }

    // 找到 createReactContext 函数 我们先 理解一下 他的参数 jsExecutor，jsBundleLoader
    // jsExecutor 这个是之前我们找到的 执行器 ，jsBundleLoader就是上述说明的Loader 这个需要重点看看，因为从上述的类来看 最总的加载在它 
    private ReactApplicationContext createReactContext(JavaScriptExecutor jsExecutor, JSBundleLoader jsBundleLoader) {
      ....
      // 关键代码 
      com.facebook.react.bridge.CatalystInstanceImpl.Builder catalystInstanceBuilder = (
        new com.facebook.react.bridge.CatalystInstanceImpl.Builder()).setReactQueueConfigurationSpec(ReactQueueConfigurationSpec.createDefault()).setJSExecutor(jsExecutor).setRegistry(nativeModuleRegistry).setJSBundleLoader(jsBundleLoader).setJSExceptionHandler((JSExceptionHandler)exceptionHandler);
      // catalystInstanceBuilder 主要做的事情 是 设置 队列（因为涉及到线程），->设置JS执行器 -> 设置 nativeModuleRegistry -> 设置 jsBundleLoader-> 设置异常捕获器

      // catalystInstanceBuilder 这个类身上就有我们的jsbundle 了
      CatalystInstanceImpl catalystInstance = catalystInstanceBuilder.build();
      // build 就是依据传如的参数 返回一个 CatalystInstanceImpl 实例
      // 最后一行就跑去了
      catalystInstance.runJSBundle() 
      // 我们分析一下  catalystInstanceBuilder 类的build 返回了什么。以及它 返回的类上的 runJSBundle 在干什么
      ....
    }
  
}

    public static class Builder {
        @Nullable
        private ReactQueueConfigurationSpec mReactQueueConfigurationSpec;
        @Nullable
        private JSBundleLoader mJSBundleLoader;
        @Nullable
        private NativeModuleRegistry mRegistry;
        @Nullable
        private JavaScriptExecutor mJSExecutor;
        @Nullable
        private JSExceptionHandler mJSExceptionHandler;

        public Builder() {
        }

        public CatalystInstanceImpl.Builder setReactQueueConfigurationSpec(ReactQueueConfigurationSpec ReactQueueConfigurationSpec) {
            this.mReactQueueConfigurationSpec = ReactQueueConfigurationSpec;
            return this;
        }

        public CatalystInstanceImpl.Builder setRegistry(NativeModuleRegistry registry) {
            this.mRegistry = registry;
            return this;
        }

        public CatalystInstanceImpl.Builder setJSBundleLoader(JSBundleLoader jsBundleLoader) {
            this.mJSBundleLoader = jsBundleLoader;
            return this;
        }

        public CatalystInstanceImpl.Builder setJSExecutor(JavaScriptExecutor jsExecutor) {
            this.mJSExecutor = jsExecutor;
            return this;
        }

        public CatalystInstanceImpl.Builder setJSExceptionHandler(JSExceptionHandler handler) {
            this.mJSExceptionHandler = handler;
            return this;
        }

        public CatalystInstanceImpl build() {
            return new CatalystInstanceImpl((ReactQueueConfigurationSpec)Assertions.assertNotNull(this.mReactQueueConfigurationSpec), (JavaScriptExecutor)Assertions.assertNotNull(this.mJSExecutor), (NativeModuleRegistry)Assertions.assertNotNull(this.mRegistry), (JSBundleLoader)Assertions.assertNotNull(this.mJSBundleLoader), (JSExceptionHandler)Assertions.assertNotNull(this.mJSExceptionHandler));
        }
    }

public class CatalystInstanceImpl implements CatalystInstance { 
    public void runJSBundle() {
            FLog.d("ReactNative", "CatalystInstanceImpl.runJSBundle()");
            Assertions.assertCondition(!this.mJSBundleHasLoaded, "JS bundle was already loaded!");

            this.mJSBundleLoader.loadScript(this); // 运行load loadScript这个不深入了，他和一部分的C++代码有关系
            // loadScript -> 实际上就是  loadScriptFromAssets(context.getAssets(), assetUrl, loadSynchronously); 返回 assetUrl string
            
            synchronized(this.mJSCallsPendingInitLock) {
                this.mAcceptCalls = true;
                Iterator var2 = this.mJSCallsPendingInit.iterator();

                while(true) {
                    if (!var2.hasNext()) {
                        this.mJSCallsPendingInit.clear();
                        this.mJSBundleHasLoaded = true;
                        break;
                    }

                    CatalystInstanceImpl.PendingJSCall function = (CatalystInstanceImpl.PendingJSCall)var2.next();
                    function.call(this);
                }
            }

            Systrace.registerListener(this.mTraceListener);
        }
}

// 从上述我们可以看到，执行runjs 的 实际上是 CatalystInstance ，这点请你记住
```

**到此为止，我们的前置知识都搞定了！**

1. 首先我们来看看第一版方案（ 直接丢到不同的 acitvy 中运行）

   主要的思路：“让多个Native 容器去承载 不同的RN 容器，每一个RN容器都是一个独立的BU业务，在通过RN 的native 桥接 就能够实现 这类的拆包”，
   需要注意的 开发阶段 和 build 阶段，

- 在开发阶段：

   由于metro build 的末日目录在根目录 ，我们的需要在root 根目录下进行 （我是指每个module 的入口要在根目录 ）要不然会有路径问题，metro 实际上是一个 static 文件托管service 它默认监听的是项目根目录， 譬如你请求的是 index.bundle.好，默认就是根目录下的index ，如果你请求的是 a.bundle,那么加载和编译的就是 根目录下的 a.js 文件，这些就是所谓的“入口文件”，这些文件里 有一个 registerComponent 方法，这个就是runtime 的时候 rn 触发的 view 试图绑定的关键代码，在RN 引擎中 ，它的加载顺序是 ：**js端先运行js代码注册组件---->原生端找到这个组件并关联**
  
- 需要注意我们的这个参数

  ```java
        mReactInstanceManager = ReactInstanceManager.builder()
              .setApplication(getApplication())
              .setCurrentActivity(this)
              .setBundleAssetName("index.android.bundle")  // 对应的release 包名称，如果多个业务就是 bu1.android.bundle, bu2.android.bundle ......
              .setJSMainModulePath("index") // 根目录下 index.js . 如果同的文件 就是 Bu1.js  Bu2.js xxxxx 依次类推 不一定都叫这个名字哈 只在dev 模式下生效 setJSMainModulePath
              .addPackages(packages)
              .setUseDeveloperSupport(BuildConfig.DEBUG)
              .setInitialLifecycleState(LifecycleState.RESUMED)
              .build();
        mReactRootView.startReactApplication(mReactInstanceManager, "MyReactNativeApp", null); // js 端 的registerComponent name MyReactNativeApp
        setContentView(mReactRootView);
  ```

2. 第二版方案 （基础包 common + bu 业务包 = 运行时的 全量包 ）

  我们的发现上述的分包方案有明显的不足：“每个独立的包 都包含RN 的公共部分”，它会让我们的包体积变大，加载的时候白屏实际也会变长，基于此和市面上主流的方案，我们可以这样玩 ：把公共的包提取出来，bu包只包含业务，在实际运行的时候，把它们合成一个  runtime 的bundle 去执行，于是我们就有了这样的东西： common + bu 业务包 = 运行时的 全量包

- 首先我们就要处理 “拆开” 这一个问题，在上述的 cli 源码分析中，我可以所需要用到的东西，只有两个函数 metro 提供的配置 createModuleIdFactory 和 processModuleFilter，前者处理模块命名，后者处理过滤（哪些需要打入bundle 哪些不需要），主要的内容前问已经描述过了，这里不在赘述

  我们先看看moduleId 的处理，首先啊，我们还是使用 number 做为 id （而不是使用string string 太大了），为了区分基础包和 bu 包，我们规定 10000000 为业务包的开始自增的 moduleId 初值（每个BU的值不一样，main->10000000 -> bu1 20000000-> bu2 -> 30000000） ，基础包的id 还是从0 -> 开始递增。还需要注意的是，由于我们的moduleId 之间是有相互依赖的 ，所以为了确保，依赖关系的正确性，我们需要为基础包做一个映射（做法是 把基础包的 路径 存到一个json 中，业务包遇到这个路径的时候 去找这个映射中的moduleId 就好了）如果你不这样做，那么你的模块依赖 会乱掉. 而在 bu 打包的时候 只需要过滤掉 基础包映射中的js module就好了

  build.js

  ```js
  const fs = require("fs");

  const clean = function (file) {
    fs.writeFileSync(file, JSON.stringify({}));
  };

  const hasBuildInfo = function (file, path) {
    const cacheFile = require(file);
    return Boolean(cacheFile[path]);
  };

  const writeBuildInfo = function (file, path, id) {
    const cacheFile = require(file);
    cacheFile[path] = id;
    fs.writeFileSync(file, JSON.stringify(cacheFile));
  };

  const getCacheFile = function (file, path) {
    const cacheFile = require(file);
    return cacheFile[path] || 0;
  };

  const isPwdFile = (path) => {
    const cwd = __dirname.split("/").splice(-1, 1).toString();

    const pathArray = path.split("/");
    const map = new Map();
    const reverseMap = new Map();

    pathArray.forEach((it, indx) => {
      map.set(it, indx);
      reverseMap.set(indx, it);
    });

    if (pathArray.length - 2 == map.get(cwd)) {
      return reverseMap.get(pathArray.length - 1).replace(/\.js/, "");
    }

    return "";
  };

  module.exports = {
    hasBuildInfo,
    writeBuildInfo,
    getCacheFile,
    clean,
    isPwdFile,
  };

  ```
  
  common.metro.js

  ```js
  const { hasBuildInfo, writeBuildInfo, clean } = require("./build");

  function createModuleIdFactory() {
    const fileToIdMap = new Map();
    let nextId = 0;
    clean("./config/bundleCommonInfo.json");

    // 如果是业务 模块请以 10000000 来自增命名
    return (path) => {
      let id = fileToIdMap.get(path);

      if (typeof id !== "number") {
        id = nextId++;
        fileToIdMap.set(path, id);

        !hasBuildInfo("./config/bundleCommonInfo.json", path) &&
          writeBuildInfo(
            "./config/bundleCommonInfo.json",
            path,
            fileToIdMap.get(path)
          );
      }

      return id;
    };
  }

  module.exports = {
    serializer: {
      createModuleIdFactory: createModuleIdFactory, // 给 bundle 一个id 避免冲突 cli 源码中这个id 是从1 开始 自增的
    },
  };

  ```

  mian.metro.js

  ```js
  const { hasBuildInfo, getCacheFile, isPwdFile } = require("./build");
  const bundleBuInfo = require("./config/bundleBuInfo.json");
  function postProcessModulesFilter(module) {
    if (
      module["path"].indexOf("__prelude__") >= 0 ||
      module["path"].indexOf("polyfills") >= 0
    ) {
      return false;
    }

    if (hasBuildInfo("./config/bundleCommonInfo.json", module.path)) {
      return false;
    }

    return true;
  }

  // 不要使用 string 会导致 bundle 体积陡增
  function createModuleIdFactory() {
    // 如果是业务 模块请以 10000000 来自增命名
    const fileToIdMap = new Map();
    let nextId = 10000000;
    let isFirst = false;

    return (path) => {
      if (Boolean(getCacheFile("./config/bundleCommonInfo.json", path))) {
        return getCacheFile("./config/bundleCommonInfo.json", path);
      }

      if (!isFirst && isPwdFile(path)) {
        nextId = bundleBuInfo[isPwdFile(path)];
        isFirst = true;
      }

      let id = fileToIdMap.get(path);
      if (typeof id !== "number") {
        id = nextId++;
        fileToIdMap.set(path, id);
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

  ```

  config/bundleBuInfo.json

  ```json
    {
      "index": 10000000,
      "Bu1": 20000000,
      "Bu2": 30000000
    }
  ```

- 执行build 命令就好了, 当然你可以把它们都编如一个shell 中去 打包简化的目的, 我这里没有怎么做，因为我们后续还需针对热更新做优化
  
  ```shell
  # common
  yarn react-native bundle --platform android --dev false --entry-file ./common.js --bundle-output ./android/app/src/main/assets/common.android.bundle --assets-dest ./android/app/src/main/res --config ./metro.common.config.js --reset-cache

  # BU
  yarn react-native bundle --platform android --dev false --entry-file ./Bu2.js --bundle-output ./android/app/src/main/assets/bu2.android.bundle --assets-dest ./android/app/src/main/res --config ./metro.main.config.js --reset-cache
  ```

  打包之前（假设我们没有 进行压缩🗜️ 参数 --minify false  ）我们发现，如果不拆包 每个bundle 也得有 将近2.3M的大小，
  
  打包之后（假设我们不对代码 进行压缩🗜️ 参数 --minify false ）我们发现common 1.9MB （比较大 因为包含了公共依赖），其余的包 基本不到 50kb

  可以看到 效果显著啊，如果进行压缩 处理 common 将不足1kb 每个 bu将不会超过 20kb

  **特别说明，上述的大小对比仅仅是我的这个项目来说，实际情况还是要以项目实际情况为主**
  
  - 好了现在我们把js 的拆分已经完成了，然后重点来了“如何在Android native”，合并这两个包形成一个runtime 的 bundle呢？

  ```java
  // 前文中我们就提到过 android code 执行的流程，现在我们来change 一下啊 ，主要的核心代码是：（具体的完整代码请看 源码）
  // 我这里把它们抽象 一个公共的类，每个 Activity 加载的时候 重写 getJSBundleAssetName，getJsModulePathPath，getResName 就 可以很方便的加载指定 的 Activity 了 ，
  
      @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
            }
        }
        SoLoader.init(this, false);

        // root 容器
        mReactRootView = new ReactRootView(this);

        if( BuildConfig.DEBUG ){
            mReactInstanceManager = ReactInstanceManager.builder()
                    .setApplication(getApplication())
                    .setCurrentActivity(this)
                    .setBundleAssetName(getJSBundleAssetName())
                    .setJSMainModulePath(getJsModulePathPath())
                    .addPackages(MainApplication.getInstance().packages)
                    .setUseDeveloperSupport(true)
                    .setInitialLifecycleState(LifecycleState.RESUMED)
                    .build();

            mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
            setContentView(mReactRootView);
            return;
        }


        mReactInstanceManager = MainApplication.getInstance().builder.setCurrentActivity(this).build();

        if (!mReactInstanceManager.hasStartedCreatingInitialContext()) {
            mReactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(ReactContext context) {
                    //加载业务包
                    ReactContext mContext = mReactInstanceManager.getCurrentReactContext();
                    CatalystInstance instance = mContext.getCatalystInstance();
                    ((CatalystInstanceImpl)instance).loadScriptFromAssets(context.getAssets(), "assets://" + getJSBundleAssetName(),false);

                    mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
                    setContentView(mReactRootView);

                    mReactInstanceManager.removeReactInstanceEventListener(this);
                }
            });
            mReactInstanceManager.createReactContextInBackground();
        }

        return;
    }

  ```

  - 但光这样就结束了？远远没有，如果像上述这样做的话，会导致 每个 Activity 都会全量载入 一次 bundle ，如果有一种方法，能够把基础的common 缓存起来，每次 Activity 只加载 bu 包就好了。

  市面上对于这一块有不同的做法，网上能搜到的就是 腾讯某团队的 一篇文章了 （<https://cloud.tencent.com/developer/article/1005382>），但是这....是有局限的 直接缓存 RootView 要仔细处理 Native 的生命周期 和 RN 的生命周期，要不然会导致 缓存的RootView 无法执行 componnetDid 等，因为他执行过一次就不在执行js 了你没有reload js 只是缓存绘制好的View 而且 ，在 native 的 onDestroy 中也要处理，要不然缓存的view 无法相应JS。

  基于此我换了一种思路去实现呢它，我把common 缓存起来，动态加载不同的bundle ，目前我现在的做法基本上 是妙进的！
  
  ```java
  // MainApplication
  public class MainApplication extends Application   {
      public ReactInstanceManagerBuilder builder;
      public  List<ReactPackage> packages;
      private  ReactInstanceManager cacheReactInstanceManager;
      private Boolean isload = false;

      private static MainApplication mApp;

      @Override
      public void onCreate() {
          super.onCreate();
          SoLoader.init(this, /* native exopackage */ false);
          mApp = this;

          packages = new PackageList(this).getPackages();
          packages.add(new RNToolPackage());

          cacheReactInstanceManager = ReactInstanceManager.builder()
                  .setApplication(this)
                  .addPackages(packages)
                  .setJSBundleFile("assets://common.android.bundle")
                  .setInitialLifecycleState(LifecycleState.BEFORE_CREATE).build();

      }

      public static MainApplication getInstance(){
          return mApp;
      }

      // 获取 已经缓存过的 rcInstanceManager
      public ReactInstanceManager getRcInstanceManager () {
          return this.cacheReactInstanceManager;
      }


      public void setIsLoad(Boolean isload) {
          this.isload = isload;
      }

      public boolean getIsLoad(){
          return this.isload;
      }

  // PreBaseInit （只列出 核心的代码 ） 完整代码请到仓库 自行查看
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
            }
        }
        SoLoader.init(this, false);

        if( BuildConfig.DEBUG ){
            mReactRootView = new ReactRootView(this);
            mReactInstanceManager = ReactInstanceManager.builder()
                    .setApplication(getApplication())
                    .setCurrentActivity(this)
                    .setBundleAssetName(getJSBundleAssetName())
                    .setJSMainModulePath(getJsModulePathPath())
                    .addPackages(MainApplication.getInstance().packages)
                    .setUseDeveloperSupport(true)
                    .setInitialLifecycleState(LifecycleState.RESUMED)
                    .build();

            mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
            setContentView(mReactRootView);
            return;
        }

        // 重新设置 Activity 和 files
        mReactInstanceManager = MainApplication.getInstance().getRcInstanceManager();
        mReactInstanceManager.onHostResume(this, this);
        mReactRootView = new ReactRootView(this);

        mReactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
            @Override
            public void onReactContextInitialized(ReactContext context) {
                MainApplication.getInstance().setIsLoad(true);

                //加载业务包
                ReactContext mContext = mReactInstanceManager.getCurrentReactContext();
                CatalystInstance instance = mContext.getCatalystInstance();
                ((CatalystInstanceImpl)instance).loadScriptFromAssets(context.getAssets(), "assets://" + getJSBundleAssetName(),false);

                mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
                setContentView(mReactRootView);

                mReactInstanceManager.removeReactInstanceEventListener(this);
            }
        });

        if(MainApplication.getInstance().getIsLoad()){
            ReactContext mContext = mReactInstanceManager.getCurrentReactContext();
            CatalystInstance instance = mContext.getCatalystInstance();
            ((CatalystInstanceImpl)instance).loadScriptFromAssets(mContext.getAssets(), "assets://" + getJSBundleAssetName(),false);

            mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
            setContentView(mReactRootView);

        }

        mReactInstanceManager.createReactContextInBackground();
        return;
    }
  ```

  **至此 基于RN 的拆包 JS 和 Android 端已经完美实现**

  3. 关于热更新 和版本管理

  重要说明特（common 包为方便管理 我们不进行热更新）

  目前我使用 CodePush 遇到了问题，code push 适合 使用 rn 创建的新项目，如果使用 Android 项目开始的 那么，code push 集成 将会是一个棘手的问题。于是我自己作了一个 简单的热更新.

   技术预研

    ```md
    1. 预先调研 （删除问文件夹操作）  是否可以 创建文件夹  + CV文件  + 删除文件 - ✅

    2. 预先调研  是否可以载入 fileSystem 的包 - ✅

    3. common开头独立执行嘛 - ✅4

    3. RN 下载 zip 并解包 - ✅

    ```

    [相关详细的设计](https://github.com/BM-laoli/Android-IOS-ReactNative/blob/main/doc/SERVER_HOT.md)

# 重要的细节 （IOS）

## 按照官方的教程踩坑的地方

1. 集成阶段

- 安装pod 依赖

```rb
# Uncomment the next line to define a global platform for your project
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

install! 'cocoapods', :deterministic_uuids => false
platform :ios, '12.4'

target 'myrnapp' do
  # Comment the next line if you don't want to use dynamic frameworks
  use_frameworks!

  config = use_native_modules!
  flags = get_default_flags()

  pod 'RNDeviceInfo', path: '../node_modules/react-native-device-info'
  
  use_react_native!(
    :path => config[:reactNativePath],
    # Hermes is now enabled by default. Disable by setting this flag to false.
    # Upcoming versions of React Native may rely on get_default_flags(), but
    # we make it explicit here to aid in the React Native upgrade process.
    :hermes_enabled => false,
    :fabric_enabled => flags[:fabric_enabled],
    # Enables Flipper.
    #
    # Note that if you have use_frameworks! enabled, Flipper will not work and
    # you should disable the next line.
    # :flipper_configuration => FlipperConfiguration.enabled,
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Pods for myrnapp
  target 'myrnappTests' do
    inherit! :search_paths
    # Pods for testing
  end

  target 'myrnappUITests' do
    # Pods for testing
  end

  post_install do |installer|
    react_native_post_install(
      installer,
      # Set `mac_catalyst_enabled` to `true` in order to apply patches
      # necessary for Mac Catalyst builds
      :mac_catalyst_enabled => true
    )
    __apply_Xcode_12_5_M1_post_install_workaround(installer)
  end
end
```

- 如果你的项目中含有 SceneDelegate 请去掉它

原理 -> <https://blog.csdn.net/c1o2c3o4/article/details/108711477?spm=1001.2101.3001.6661.1&utm_medium=distribute.pc_relevant_t0.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-1-108711477-blog-104754971.t0_edu_mix&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-1-108711477-blog-104754971.t0_edu_mix&utm_relevant_index=1>

删除方法 ->  <https://www.jianshu.com/p/6b3f40319877>

删除main storyboard <https://blog.csdn.net/qq_31598345/article/details/119979791>

- 我们不用官方的例子 只是按照它提供的思路 去自己写一个

```Objective-C
//
//  ViewController.m
//  myrnapp
//
//  Created by 李仕增 on 2022/10/8.
//

#import "ViewController.h"
#import <React/RCTRootView.h>

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
//    加一些oc 的code 确保项目上正常的状态
    UIView *view = [[UIView alloc] init];
    view.backgroundColor = [UIColor redColor];
    view.frame = CGRectMake(100,100, 100, 100);
    [self.view addSubview:view];

    view.userInteractionEnabled = YES;
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(openRNView)];
    [view addGestureRecognizer:tap];

    UIView *view2 = [[UIView alloc] init];
    view2.backgroundColor = [UIColor greenColor];
    view2.frame = CGRectMake(150,300, 100, 100);
    [self.view addSubview:view2];
    
    view2.userInteractionEnabled = YES;
    UITapGestureRecognizer *tap2 = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(openRNView2)];
    [view2 addGestureRecognizer:tap2];
    
//    直接开始集成
  
}

- (void) testClick {
    NSLog(@"6666666");
}

- (void)openRNView {
    NSLog(@"High Score Button Pressed");
    NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8082/IOS.bundle?platform=ios"];

        RCTRootView *rootView =
          [[RCTRootView alloc] initWithBundleURL: jsCodeLocation
                                      moduleName: @"RNHighScores"
                               initialProperties: nil
                                   launchOptions: nil];
        UIViewController *vc = [[UIViewController alloc] init];
        vc.view = rootView;
        [self presentViewController:vc animated:YES completion:nil];
 }

- (void)openRNView2 {
    NSLog(@"High Score Button Pressed");
    NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8082/IOS2.bundle?platform=ios"];

        RCTRootView *rootView =
          [[RCTRootView alloc] initWithBundleURL: jsCodeLocation
                                      moduleName: @"RNHighScores2"
                               initialProperties: nil
                                   launchOptions: nil];
        UIViewController *vc = [[UIViewController alloc] init];
        vc.view = rootView;
        [self presentViewController:vc animated:YES completion:nil];
 }

@end

```

- 确保你的相关权限已经开放 比如网络

  确保你的info.plist 包含下面的字段

  ```xml
  <key>NSAppTransportSecurity</key>

 <dict>
  <key>NSExceptionDomains</key>
  <dict>
   <key>localhost</key>
   <dict>
    <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
    <true/>
   </dict>
  </dict>
 </dict>
  ```

2. build 阶段

- 你可能会遇到的问题
  你也许会越到当不限于下面的这些问题
  
  相关的问题都可以去react-native官方的github issue 里有，我最终采取静态连接的办法
  
  *关键代码*

  ```rb
  ++++
  use_frameworks! :linkage => :static
  # 使用静态库 连接 不要使用动态库 或者 默认的连接 ，会有问题
  ++++
  ```

- 解析来 build 环节需要注意的地方

  Native 的BUILD 现在解决了，那么RN的build 怎么办呢？
  
  首先是native 代码需要修改 资源路径 不要从远程加载 直接从本地载入

  ```c++
  - (void)openRNView2 {
      NSLog(@"High Score Button Pressed");
  //    NSURL *jsCodeLocation = [NSURL URLWithString:@"http://localhost:8082/IOS2.bundle?platform=ios"];

      NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"bundle/IOS2.ios" withExtension:@"bundle"];
      
  //        RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL: jsCodeLocation
  //                                      moduleName: @"RNHighScores2"
  //                                launchOptions: nil];
      RCTRootView *rootView = [[RCTRootView alloc]
                              initWithBundleURL:jsCodeLocation
                              moduleName:@"RNHighScores2"
                              initialProperties:nil
                              launchOptions:nil ];
      
          UIViewController *vc = [[UIViewController alloc] init];
          vc.view = rootView;
          [self presentViewController:vc animated:YES completion:nil];
  };
  ```

   然后关于js 和资源的build ，下面是它们的构建脚本

   ```shell
    yarn react-native bundle --entry-file ./IOS2.js --bundle-output ./bundle/IOS2.ios.bundle --platform ios --assets-dest ./bundle --dev false
    ```

    最后要注意的是 ==>  **请你直接把整个文件夹拖拽进入Xcode！中的projext 下**

    **如果发现有问题 跑不通， 需要分析原因 给IOS debug 看看那个环节有问题**

3. 关于native 包的问题
  
  实际上这个非常的简单，我在这个项目中 ，所有的native 包再 pod install 的时候都自动安装了，如果你需要手动包含，可以参考旧版本的做法. 在 PodFile 中手动+ （比如下面的例子）

  ```rb
  ++++
   pod 'RNDeviceInfo', path: '../node_modules/react-native-device-info'
  +++
  ```

## 重点 拆包方案

1. 参考

首先我参考了一部分的材料 主要的材料是这两片文章
[掘金文章 RN的分包实践](https://juejin.cn/post/6844903922205736973)
[GitHub项目](https://github1s.com/smallnew/react-native-multibundler/blob/HEAD/ios/reactnative_multibundler/ScriptLoadUtil.m)

2. 重要的原理

我们先看看 RN 在IOS 中的加载过程 就能明白 我目前采用的方案的原理了

-> 创建 RCTRootView，为 React Native 提供原生 UI 中的根视图。

-> 创建 RCTBridge，提供 iOS 需要的桥接功能。

-> 创建 RCTBatchedBridge，实际上是这个对象为 RCTBridge 提供方法，让其将这些方法暴露出去。
[RCTCxxBridge start]，启动 JavaScript 解析进程。
[RCTCxxBridge loadSource]，通过 RCTJavaScriptLoader 下载 bundle，并且执行。

-> 建立 JavaScript 和 iOS 之间的 Module 映射。

-> 将模块映射到对应的 RCTRootView 当中。

可以看到 最重要的是 Bridge 所有的script 的加载都可以在这找到一些线索，通过debuger 我们可以找到一个关键的方法 executeSourceCode 这就是执行 js 代码的方法。如果要实现自己的分包我必须 重写这里面的逻辑 所以有了下面的代码

如果是dev 模式的话，可以把这些code 去掉换成 http的方式，当然这些都是后话了

3. 实践

- 首先是重载 executeSourceCode 和定义 brige

```h
//  ViewController.h

#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>

// 保留出这个 方法
@interface RCTBridge (PackageBundle)

- (RCTBridge *)batchedBridge;
- (void)executeSourceCode:(NSData *)sourceCode sync:(BOOL)sync;

@end

@interface ViewController : UIViewController

@property (nonatomic, strong) RCTBridge *bridge;
@end

```

- 其次我们要重新编写一下我们的js 的build 脚本，因为ios 和android 的打出来的包不一样！，😢  之前一只使用android 的 common 包 和 bu(注意我的bu包是 ios 和ios2.js) 包，一直报错 ，找好久才找到原因

```json
{
  "build:common-ios": "react-native bundle --platform ios --dev false --entry-file ./common.js --bundle-output ./bundle/common.ios.bundle   --config ./metro.common.config.js  --minify false --reset-cache",
    "build:ios1": "react-native bundle --entry-file ./IOS.js --bundle-output ./bundle/IOS.ios.bundle --platform ios --assets-dest ./bundle  --config ./metro.main.config.js --minify false --dev false",
    "build:ios2": "react-native bundle --entry-file ./IOS2.js --bundle-output ./bundle/IOS2.ios.bundle --platform ios --assets-dest ./bundle  --config ./metro.main.config.js --minify false --dev false"
}
```

**别忘记了！你在build 的时候要把bu的其实 id 搞进去！**

```json
{
  "index": 10000000,
  "Bu1": 20000000,
  "Bu2": 30000000,
  // 把下面的bu 加上！
  "IOS": 40000000,
  "IOS2": 50000000
}

```

- 然后我们来测试一下 使用分包的模式先载入 common 再载入 bu包, 注意啊 我们不采取dev环境下的从 service 载入 bundle 我们从本地文件载入 ，因此有改动 需要先build 再去运行 查看效果

```C++
//  ViewController.m
-(instancetype) init {
    self = [super init];
    [self initBridge];
    return  self;
};

- (void) initBridge {
    if(!self.bridge) {
        NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"bundle/common.ios" withExtension:@"bundle"];
       // 初始化 bridge，并且加载主包
        self.bridge = [[RCTBridge alloc] initWithBundleURL:jsCodeLocation moduleProvider:nil launchOptions:nil];
    }
  
};

// 在点击load 的时候 让 brige 再执行一次bu 的js 
++++
-(void) loadScript {
    NSString * bundlePath = @"bundle/IOS2.ios";
    NSString * bunldeName = @"IOS2";
    NSURL  *jsCodeLocation = [[NSBundle mainBundle] URLForResource:bundlePath withExtension:@"bundle"];
    
    if(self.bridge) {
        NSError *error = nil;
        NSData *sourceBuz = [NSData dataWithContentsOfFile:jsCodeLocation.path
                                                options:NSDataReadingMappedIfSafe
                                                  error:&error];
        
        [self.bridge.batchedBridge executeSourceCode:sourceBuz sync:NO];
        
        RCTRootView *rootView =
          [[RCTRootView alloc] initWithBridge:self.bridge moduleName:bunldeName initialProperties:nil];
        UIViewController *vc = [[UIViewController alloc] init];
        vc.view = rootView;
        [self presentViewController:vc animated:YES completion:nil];
    };
}
```

可以看到 ，现在我们单独的一个bu 已经可以完全集成了，为了以后简化 函数调用我们把loadScript 改造成参数的方式

```c++
//  ViewController.h

@interface ViewController : UIViewController
@property (nonatomic, strong) RCTBridge *bridge;
-(void) loadScript:(NSString *)bundlePath bunldeName: (NSString *)bunldeName;
@end


//  ViewController.m
-(void) loadScript:(NSString *)bundlePath bunldeName: (NSString *)bunldeName {
    
    NSURL  *jsCodeLocation = [[NSBundle mainBundle] URLForResource:bundlePath withExtension:@"bundle"];
    
    if(self.bridge) {
        NSError *error = nil;
        NSData *sourceBuz = [NSData dataWithContentsOfFile:jsCodeLocation.path
                                                options:NSDataReadingMappedIfSafe
                                                  error:&error];
        
        [self.bridge.batchedBridge executeSourceCode:sourceBuz sync:NO];
        
        RCTRootView *rootView =
          [[RCTRootView alloc] initWithBridge:self.bridge moduleName:bunldeName initialProperties:nil];
        UIViewController *vc = [[UIViewController alloc] init];
        vc.view = rootView;
        [self presentViewController:vc animated:YES completion:nil];
    };
}
```

这就完了？当然没有啦，我们需要在RN中进行bu 的载入 和切换，我们需要一些桥接 的代码桥接到IOS中，
这一点我之前专门有文章讲解 ，如果你不懂请千万 [](), 同时这里还会设计到一个IOS的 知识比如notifaction 和 GCD，看不懂的话也没有关系 什么不懂google 一下 自己实践code一下就明白了，我们直接放出代码

注册RN 桥接模块，为了和Android 中保持一致，我们使用一样的名字 RNToolsManager，然后我们使用notifation 的方式 去直接调用View 中的code ，当然不要忘记了！一定要把这段代码加到主线程去 ，要不然会有问题

```c
// ViewController.m
-(instancetype) init {
    self = [super init];
    [self initBridge];
    [self addObservers];
    return  self;
};


- (void)changeView:(NSNotification *)notif{

    NSString *bundlePath = @"";
    NSString *bunldeName = @"";
    bundlePath = [notif.object valueForKey:@"bundlePath"];
    bunldeName = [notif.object valueForKey:@"bunldeName"];
    
    //  OC 的代码 我是方便调试弄的 如果你不需要可以去掉然后 把     [self presentViewController:vc animated:YES completion:nil]; 也去掉，当然还是看你们的需求吧 
    [self dismissViewControllerAnimated:YES completion:nil];

    [self loadScript:bundlePath bunldeName:bunldeName];
};

// 监听通知
- (void)addObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(changeView:) name:@"changeBunle" object:nil];
};

// 监听通知
- (void)removeObservers {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
};

- (void)dealloc {
    [self removeObservers];
};

//  RNToolPackage.m

#import "RNToolPackage.h"

@implementation RNToolPackage

RCT_EXPORT_MODULE(RNToolsManager)

// 最简单的一个方法 变更多个bundle
RCT_REMAP_METHOD(changeActivity,
                 changeActivityWithA:( NSString *)bundlePath bunldeName:( NSString*)bunldeName
                 ){
    
    // 重新设置一个rootView 
    dispatch_async(dispatch_get_main_queue(),^{
        [[NSNotificationCenter defaultCenter] postNotificationName:@"changeBunle" object:@{
            @"bundlePath":bundlePath,
            @"bunldeName":bunldeName,
        }];
    });
    
};

@end

```

最后要说的，我们需要统一一下android ios rn 的module 跳转方法

```js
// ./common/native/index.js
changeActivity: (value) => {
    // 此处可以优化 把名字全部统一，只需要确定一个规则 path 为 [moduleName].[platform].bundle
    // 比如 common.ios.bundle, IO2.ios.bundle, common.android.bundle, IO2.android.bundle, 
    // 参数只需要 传递 IO2 就好了这个IOS2 应该和模块的 registerComponent name 保持一致！
    if(Platform.OS === 'ios') {
      return NativeModules.RNToolsManager.changeActivity(`bundle/${value}.ios`, value); 
    }
    return NativeModules.RNToolsManager.changeActivity(value, null);
  },
```

# Todo

| 项目      | Android | IOS     |
| :---        |    :----:   |          ---: |
| 依照官方进行集成      | ✅ 完成       |  ✅ 完成  |
| dev是否正常运行   |      ✅ 完成   |  ✅ 完成     |
| build 一下是否正常运行   |    ✅ 完成     |  ✅ 完成     |
| Assets 资源加载逻辑   |     ✅ 完成    |  ✅ 完成      |
| native版本的包管理   |    ✅ 完成     |  ✅ 完成      |
| ------  |    ------      |  ------      |
| 初步的拆包方案   |    ✅ 完成     |    ✅ 完成      |
| 优化拆包方案 common + bu = runtime    |    ✅ 完成     |  ✅ 完成      |
| 容器的缓存复用    |    ✅ 完成      |   ✅ 完成(bridge 复用)    |
| ------  |    ------      |  ------      |
| 热更新的实现   |    ✅ 完成     |  /      |
| WebView 的实现   |    /     |  /      |

# 参考和感谢

[RN 的Android 端执行过程](https://fsilence.github.io/2018/01/09/react-native-load-jsbundle/)

[一种RN的分包策略](https://cloud.tencent.com/developer/article/1005382)

<https://stackoverflow.com/questions/42091721/how-to-get-offline-bundling-of-ios-in-react-native>

<https://stackoverflow.com/questions/42091721/how-to-get-offline-bundling-of-ios-in-react-native>

<https://www.uglydirtylittlestrawberry.co.uk/posts/react-native-ios-build-and-inject-bundle/>

<https://www.jianshu.com/p/0e830adc4c90>

<https://stackoverflow.com/questions/72543728/xcode-14-deprecates-bitcode-but-why/73219854#73219854>

<https://www.jianshu.com/p/e09ca00d7aaa>
