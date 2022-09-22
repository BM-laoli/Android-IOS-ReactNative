# 介绍

为了实现和探究ReactNative的分包功能，以及构建一个 相对从性能上 和 技术上都比较ok 的项目架构 而存在的一个库。你可以把它理解为一个 App的技术架构 方案。

# 重要细节

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

1.1 说到拆包我们先了解 包 是什么 由 什么组成

   一个 包 bundle 说白了 就说 一些js 代码，只不过后缀叫 bundle ，它实际上是一些js 代码，只不过这些代码的运行 环境在RN 提供的环境 不是在浏览器，通过这些代码RN 引擎可以使用 Native 组件 渲染 出你想要的UI ，好 这就是 包 bundle。

   一个rn 的bundle 主要由三部分构成

   1. 环境变量 和 require define 方法的预定义

   2. define 载入业务代码

   3. 执行

  ```js

// 环境定义
var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now(),__DEV__=false,process=this.process||{},__METRO_GLOBAL_PREFIX__='';process.env=process.env||{};process.env.NODE_ENV=process.env.NODE_ENV||"production";


// 全局的定义 比如 引擎自己的require defeind 
(function (global) {
  "use strict";

  global.__r = metroRequire;
  global[__METRO_GLOBAL_PREFIX__ + "__d"] = define;
  global.__c = clear;
  global.__registerSegment = registerSegment;
  var modules = clear();
  var EMPTY = {};


  // 最后是执行 程序
  __r(21);
__r(0);
......


  ```

1. 首先我们来看看第一版方案（ 直接丢到不同的 acitvy 中运行）

   主要的思路：“让多个Native 容器去承载 不同的RN 容器，每一个RN容器都是一个独立的BU业务，在通过RN 的native 桥接 就能够实现 这类的拆包”，
   需要注意的开发阶段 和 build 阶段，

- 在开发阶段 尤其的metro 下，我们的需要在root 根目录下进行 要不然，会发生路径错误，然后 需要注意的一点是 路径问题
   在metro 上 譬如你请求的是 index.bundle.好，默认就是根目录下的index ，如果你请求的是 a.bundle,那么加载和编译的就是 根目录下的 a.js 文件，这些就是所谓的“入口文件”，它里面有一个 registerComponent 方法，这个就是runtime 的时候 rn 触发的 view 试图绑定的逻辑，在RN 引擎中 ，它的加载顺序是 ：**js端先运行js代码注册组件---->原生端找到这个组件并关联**
  
- 需要注意我们的这个参数  

  ```java
          mReactInstanceManager = ReactInstanceManager.builder()
                .setApplication(getApplication())
                .setCurrentActivity(this)
                .setBundleAssetName("index.android.bundle")  // 对应的release 包名称，如果多个业务就是 bu1.android.bundle, bu2.android.bundle ......
                .setJSMainModulePath("index") // 根目录下 index.js . 如果同的文件 就是 Bu1.js  Bu2.js xxxxx 依次类推 不一定都叫这个名字哈
                .addPackages(packages)
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();
        mReactRootView.startReactApplication(mReactInstanceManager, "MyReactNativeApp", null); // js 端 的registerComponent name MyReactNativeApp
        setContentView(mReactRootView);
  ```

2. 第二版方案 （基础包 common + bu 业务包 = 运行时的 全量包 ）

 要解决的问题

# Todo

| 项目      | Android | IOS     |
| :---        |    :----:   |          ---: |
| 依照官方进行集成      | ✅ 完成       |  /  |
| dev是否正常运行   |      ✅ 完成   |  /      |
| build 一下是否正常运行   |    ✅ 完成     |  /      |
| Assets 资源加载逻辑   |     ✅ 完成    |  /      |
| native版本的包管理   |    ✅ 完成     |  /      |
| 初步的拆包方案   |    ✅ 完成     |  /      |
| 进一步的 初步的拆包方案   |         |  /      |
| 热更新的实现   |    /     |  /      |
| WebView 的实现   |    /     |  /      |
