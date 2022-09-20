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

# Todo

| 项目      | Android | IOS     |
| :---        |    :----:   |          ---: |
| 依照官方进行集成      | ✅ 完成       |  /  |
| dev是否正常运行   |      ✅ 完成   |  /      |
| build 一下是否正常运行   |    ✅ 完成     |  /      |
| Assets 资源加载逻辑   |     ✅ 完成    |  /      |
| native版本的包管理   |    ✅ 完成     |  /      |
| 热更新的实现   |    /     |  /      |
| WebView 的实现   |    /     |  /      |
