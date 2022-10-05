# 说明

> 这里是SERVER_HOT 的设计 说明，希望可以帮助到你, 我知道这里的设计可能存在一些缺陷 ，但不要担心, 我后续会持续优化, 待优化的问题 (没有区分 不同模块的版本)

## 数据库设计(SQLite)

> 我们使用 sqlite3 它足够小型和简单，且可以随时移动

1. 创建数据库和表

```sql
CREATE TABLE APP_INFO(
  ID INT PRIMARY KEY     NOT NULL,
  APP_NAME           CHAR(255)    NOT NULL,
  APP_DES            CHAR(255)     NOT NULL,
  CURRENT_VERSION        CHAR(255),
  APP_KEY         CHAR(255),
  NATIVE_VERSION         CHAR(255)
);

CREATE TABLE MODULE_INFO(
  ID INT PRIMARY KEY     NOT NULL,
  MODULE     CHAR(255),
  PLATFORM     CHAR(255),
  APP_INFO_ID    INT NOT NULL
);

CREATE TABLE VERSION_INFO(
  ID  INT PRIMARY KEY     NOT NULL,
  VERSION           CHAR(255)    NOT NULL,
  FILE_PATH            CHAR(255)     NOT NULL,
  DES        CHAR(255),
  TYPE         CHAR(255),
  MODULE_ID    INT NOT NULL,
  IS_ACTIVE INT NOT NULL,
  FILENAME     CHAR(255)
);

```

2. INSET 数据

```sql
INSERT INTO APP_INFO ( ID, APP_NAME, APP_DES, CURRENT_VERSION, APP_KEY, NATIVE_VERSION) VALUE (1, 'app1', 'des', '1.0.0','aaaa', '1.0.0')
-- 后续不一一列举了
```

3. 查询 和 删除数据

```sql
SELECT * FROM APP_INFO;

SELECT VERSION, APP_NAME, FILE_PATH, DES, TYPE FROM APP_INFO INNER JOIN VERSION_INFO ON APP_INFO.ID = VERSION_INFO.APP_INFO_ID;

DELETE FROM APP_INFO

-- 后续不一一列举了
```

## API设计  

> 我们采用一个 十分简单的 NodeServer 来完成

```js
// 关键代码 上传
const toZip = async (filename, filePath) => {
  return compressing.zip.compressFile(
    `${__dirname}/${filePath}`,
    `${__dirname}/public/${filename}`
  );
};

router_api.post("/update_bundle", async (req, res) => {
  // 上传的文件在req.files中
  const version = req.query.version;
  const filename = `bundleFile/${version}-${req.files[0].originalname}`;

  fs.rename(req.files[0].path, filename, async (err) => {
    if (err) {
      res.send({
        data: null,
        success: false,
        message: "上传失败",
      });
    } else {
      await toZip(`${version}-${req.files[0].originalname}.zip`, filename);
      res.send({
        data: {
          path: `/file/${version}-${req.files[0].originalname}.zip`,
          filename: `${version}-${req.files[0].originalname}.zip`,
        },
        success: true,
        message: "上传成功",
      });
    }
  });
});

// 关键代码 判断版本
router_api.get("/version_info", async (req, res) => {
  const params = {
    oldVersion: "",
    pageModule: "",
    type: "",
    appKey: "",
    ...req.query,
  };

  // 如果当前版本和服务器上 最新版本不正确 请返回最新版本 -- start
  // 1. 先找到app
  const appInfo = await promiseQuery(
    `SELECT * FROM APP_INFO WHERE APP_KEY = '${params.appKey}'`
  );

  const oldVersionStr = `${params.oldVersion}-${params.pageModule}.zip`;

  // 2. 找到 当前模块 在 APP_INFO 中的最新版本
  const currentVersion = await promiseQuery(
    `SELECT * FROM VERSION_INFO WHERE APP_INFO_ID=${appInfo[0].ID} 
      AND VERSION_INFO.VERSION = '${appInfo[0].CURRENT_VERSION}' 
      AND VERSION_INFO.FILENAME ='${oldVersionStr}' AND VERSION_INFO.TYPE = '${params.type}'
      `
  );

  // 3.如果当前模块 最新 VERSION 和APP内的最新VERSION 一致 则不需要更新
  if (currentVersion.length) {
    res.json({
      data: {
        isNeedRefresh: false,
      },
      success: true,
      message: "当前版本一致 不需要更新",
    });
    return;
  }
  // 如果当前版本和服务器上 最新版本不正确 请返回最新版本-- end

  // 如果版本不正确 就返回对应的 文件
  const findVersionInfo = await promiseQuery(
    `SELECT * FROM VERSION_INFO WHERE APP_INFO_ID=${appInfo[0].ID} AND VERSION_INFO.VERSION = '${appInfo[0].CURRENT_VERSION}' AND VERSION_INFO.TYPE = '${params.type}'`
  );

  res.json({
    data: {
      newVersion: findVersionInfo[0].VERSION,
      downloadPathL: findVersionInfo[0].FILE_PATH,
      fileName: findVersionInfo[0].FILENAME,
      type: findVersionInfo[0].TYPE,
      isNeedRefresh: true,
    },
    success: true,
    message: "请更新你的版本",
  });
});

// 更多完整代码请访问详细的文件夹
```

## Android

> 有些操作 需要依赖Android 客户端 ，其中有下面的几个函数, 其中有一部分的代码是从 codePush 那边抄来的，然后做了点小修改

// utils 工具

```java
 /**
     * 实现rn -> 切换Activity 注意 参数我们使用json string 虽然提供了 方法让你 传数据，但是不建议 业务是不同Bu业务
     * @param name
     * @param params
     */
    @ReactMethod
    public void changeActivity (String name,String params) {
        try{
            Activity currentActivity = getCurrentActivity();
            if(currentActivity != null){
                Class toActivity = Class.forName(name);
                Intent intent = new Intent(currentActivity,toActivity);
                intent.putExtra(EXTRA_MESSAGE, params);
                currentActivity.startActivity(intent);
            }
        }catch (Exception e) {
            throw new JSApplicationIllegalArgumentException(
                    "不能打开Activity : "+e.getMessage());
        }
    }

    @ReactMethod
    public void getAndroidDEV (Promise promise) {
        promise.resolve(!BuildConfig.DEBUG);
    };

    public void createVersionInfo(String jversion){
            String path = reactContext.getExternalFilesDir(null).getAbsolutePath();
            File files = new File(path);

            if (!files.exists()) {
                files.mkdirs();
            }
            if (files.exists()) {
                try {
                    FileWriter fw = new FileWriter(path + File.separator
                            +"version.json");
                    fw.write(jversion);
                    Log.i(TAG, "createVersionInfo: jversion" + jversion);
                    fw.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
    };

    // CV 文件 和创建初试文件
    @ReactMethod
    public void writeFileFoRC (String jversion) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath();

        // 创建version.json
        createVersionInfo(jversion);

        // 新建文件夹 /Bundle/staging 和/Bundle/release 并且完成CV
        createDir(path + "/Bundle/staging/");
        createDir(path + "/Bundle/release/");
        try {
            String fileNames[] = reactContext.getAssets().list("");
            for(String fileName: fileNames) {
                if(fileName.indexOf(".bundle") > 0) {
                    CopyAssets(reactContext,fileName, path + "/Bundle/staging/" + fileName);
                    CopyAssets(reactContext,fileName, path + "/Bundle/release/" + fileName);
                }
            }

        }catch (IOException ioe) {
            Log.i(TAG, "writeFileFoRC: "+ioe);
        }
    }

    // 配置文件是否完成创建
    @ReactMethod
    public void isInited (Promise promise){
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath();
        File file = new File(path + "/version.json");
        // 如果有值 就不要重复创建了
        if(  file.exists()  ){
            promise.resolve(true);
        }else{
            promise.resolve(false);
        }
    }

    // 返回 最新 本地的info信息
    @ReactMethod
    public  void getCurrentVersion (String module,String type, Promise promise) {
        Map<String,String> versionInfo = currentVersionByBundleName(reactContext,module,type);
        WritableMap map = Arguments.createMap();

        map.putString("module", module);
        map.putString("version",versionInfo.get("version") );
        map.putString("type",versionInfo.get("type") );
        map.putString("key", versionInfo.get("key") );

        promise.resolve(map);
        return;
    }

    // 更新本地INFO for JSONFILE 信息
    @ReactMethod
    public void setFileVersion (String module,String type,String newVersion ) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/version.json";
        StringBuilder sb = new StringBuilder();
        try {
            File file = new File(path);
            InputStream in = null;
            in = new FileInputStream(file);
            int tempbyte;
            while ((tempbyte = in.read()) != -1) {
                sb.append((char) tempbyte);
            }
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            JSONObject versionJSON = new JSONObject(sb.toString());
            JSONObject typeVersionJObject = versionJSON.getJSONObject(type);
            typeVersionJObject.put(module,newVersion);

            // 重新创建
            createVersionInfo(versionJSON.toString());

        }catch (Exception e) {

        }


    }

    // 删除某路径下的所有文件 String path 先不传
    @ReactMethod
    public void cleanFileByPath () {

        String filePath$Name = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/Bundle/staging/bu2.android.bundle";
            File file = new File(filePath$Name);
            // 如果文件路径所对应的文件存在，并且是一个文件，则直接删除
            if (file.exists() && file.isFile()) {
                if (file.delete()) {
                    Log.i(TAG, "cleanFileByPath: 删除成功 " + filePath$Name);
                } else {
                    Log.i(TAG, "cleanFileByPath: 删除失败 " + filePath$Name);
                }
            } else {
                Log.i(TAG, "cleanFileByPath: 文件不存在 " + filePath$Name);
            }
    }

    // 自己下载文件并且解压且替换
    @ReactMethod
    public void downloadFiles (String downloadUrl, String type,String module, Promise promise) {
        try{
            //下载路径，如果路径无效了，可换成你的下载路径
            String url = downloadUrl;
            String path = reactContext.getExternalFilesDir(null).getAbsolutePath();

            // 要下载到的路径
            String downPath = path +"/Bundle/" + type + "/";
            String modulePath = path +"/Bundle/" + type + "/" + module;


            final long startTime = System.currentTimeMillis();

            //下载函数
            String filename=url.substring(url.lastIndexOf("/") + 1);
            //获取文件名
            URL myURL = new URL(url);
            URLConnection conn = myURL.openConnection();
            conn.connect();
            InputStream is = conn.getInputStream();
            int fileSize = conn.getContentLength();//根据响应获取文件大小
            if (fileSize <= 0) throw new RuntimeException("无法获知文件大小 ");
            if (is == null) throw new RuntimeException("stream is null");
            File file1 = new File(path);
            if(!file1.exists()){
                file1.mkdirs();
            }
            //把数据存入路径+文件名
            FileOutputStream fos = new FileOutputStream(downPath+filename);
            byte buf[] = new byte[1024];
            int downLoadFileSize = 0;
            do{
                //循环读取
                int numread = is.read(buf);
                if (numread == -1)
                {
                    break;
                }
                fos.write(buf, 0, numread);
                downLoadFileSize += numread;
                //更新进度条
            } while (true);

            Log.i("DOWNLOAD","download success");
            Log.i("DOWNLOAD","totalTime="+ (System.currentTimeMillis() - startTime));

            promise.resolve("成功");
            touchZip(downPath+filename, downPath,modulePath);

            is.close();
        } catch (Exception ex) {
            Log.e("DOWNLOAD", "error: " + ex.getMessage(), ex);
        }
    }

    public static void deleteFileOrFolderSilently(File file) {
        if (file.isDirectory()) {
            File[] files = file.listFiles();
            for (File fileEntry : files) {
                if (fileEntry.isDirectory()) {
                    deleteFileOrFolderSilently(fileEntry);
                } else {
                    fileEntry.delete();
                }
            }
        }

        if (!file.delete()) {
            Log.e(TAG, "deleteFileOrFolderSilently: ");
        }
    }

    public void touchZip (String filePath, String downPath, String modulePath) {
        // zip地址
        File zipFile = new File(filePath);
        File oldModuleFile = new File(modulePath);

        // 解压缩目标地址
        String destination = downPath;

        // 删除旧的版本
        deleteFileOrFolderSilently(oldModuleFile);

        FileInputStream fileStream = null;
        BufferedInputStream bufferedStream = null;
        ZipInputStream zipStream = null;
        try {
            fileStream = new FileInputStream(zipFile);
            bufferedStream = new BufferedInputStream(fileStream);
            zipStream = new ZipInputStream(bufferedStream);
            ZipEntry entry;

            File destinationFolder = new File(destination);

            destinationFolder.mkdirs();

            byte[] buffer = new byte[WRITE_BUFFER_SIZE];
            while ((entry = zipStream.getNextEntry()) != null) {
//                String fileName = validateFileName(entry.getName(), destinationFolder);

                File file = new File(modulePath);
                if (entry.isDirectory()) {
                    file.mkdirs();
                } else {
                    File parent = file.getParentFile();
                    if (!parent.exists()) {
                        parent.mkdirs();
                    }

                    FileOutputStream fout = new FileOutputStream(file);
                    try {
                        int numBytesRead;
                        while ((numBytesRead = zipStream.read(buffer)) != -1) {
                            fout.write(buffer, 0, numBytesRead);
                        }
                    } finally {
                        fout.close();
                    }
                }
                long time = entry.getTime();
                if (time > 0) {
                    file.setLastModified(time);
                }
            }
            if (zipStream != null) zipStream.close();
            if (bufferedStream != null) bufferedStream.close();
            if (fileStream != null) fileStream.close();

            if (destinationFolder.exists()) {
                //  删除你下载的zip
                deleteFileOrFolderSilently(zipFile);
            }

        } catch (IOException ioe){
            Log.i(TAG, "touchZip: ioe"+ ioe);
        }
    }

    public void createDir(String filePath) {
        File file = new File(filePath);

        if (file.exists()) {
            Log.i(TAG, "文件夹以及存在");
        }
        if (filePath.endsWith(File.separator)) {// 以 路径分隔符 结束，说明是文件夹
            Log.i(TAG, "文件夹以及存在");
        }

        if (!file.mkdirs()) {
            Log.i(TAG, "创建成功");
        }
    }

    public static void CopyAssets(Context context, String oldPath, String newPath) {
        try {
            String fileNames[] = context.getAssets().list(oldPath);// 获取assets目录下的所有文件及目录名
            if (fileNames.length > 0) {// 如果是目录
                File file = new File(newPath);
                file.mkdirs();// 如果文件夹不存在，则递归
                for (String fileName : fileNames) {
                    CopyAssets(context, oldPath + "/" + fileName, newPath + "/" + fileName);
                }
            } else {// 如果是文件
                InputStream is = context.getAssets().open(oldPath);
                FileOutputStream fos = new FileOutputStream(new File(newPath));
                byte[] buffer = new byte[1024];
                int byteCount;
                while ((byteCount = is.read(buffer)) != -1) {// 循环从输入流读取
                    // buffer字节
                    fos.write(buffer, 0, byteCount);// 将读取的输入流写入到输出流
                }
                fos.flush();// 刷新缓冲区
                is.close();
                fos.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static Map<String,String> currentVersionByBundleName (Context reactContext, String module, String type) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/version.json";

        StringBuilder sb = new StringBuilder();
        try {
            File file = new File(path);
            InputStream in = null;
            in = new FileInputStream(file);
            int tempbyte;
            while ((tempbyte = in.read()) != -1) {
                sb.append((char) tempbyte);
            }
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        final Map<String, String> constants = new HashMap<>();

        try {
            JSONObject versionJSON = new  JSONObject(sb.toString());
            String version = versionJSON.getJSONObject(type).getString(module);
            String moduleType = versionJSON.getBoolean("isStaging") ? "staging": "release";
            String key = versionJSON.getString("key");

            // 放回当前的 bundle Version
            constants.put("version",version);
            constants.put("type",moduleType);
            constants.put("key",key);

            return constants;

        }catch (Exception e) {
            Log.i(TAG, "currentVersionByBundleName: ",e);
            return constants;
        }

    };

    static Map<String,String> currentVersionByBundleName (Context reactContext) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/version.json";

        StringBuilder sb = new StringBuilder();
        try {
            File file = new File(path);
            InputStream in = null;
            in = new FileInputStream(file);
            int tempbyte;
            while ((tempbyte = in.read()) != -1) {
                sb.append((char) tempbyte);
            }
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        final Map<String, String> constants = new HashMap<>();

        try {
            JSONObject versionJSON = new  JSONObject(sb.toString());

            String moduleType = versionJSON.getBoolean("isStaging") ? "staging": "release";
            constants.put("moduleType",moduleType);

            return constants;

        }catch (Exception e) {
            Log.i(TAG, "currentVersionByBundleName: ",e);
            return constants;
        }

    };

    static Boolean hasCache (Context context) {
        String path = context.getExternalFilesDir(null).getAbsolutePath();
        File file = new File(path + "/version.json");
        // 如果有值 就不要重复创建了
        if(  file.exists()  ){
            return  true;
        }else{
            return  false;
        }
    }
```

// 加载器

```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        this.preInit();
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

                loadForSystemOrAssets(instance,context);

                mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
                setContentView(mReactRootView);

                mReactInstanceManager.removeReactInstanceEventListener(this);
            }
        });

        if(MainApplication.getInstance().getIsLoad()){
            ReactContext mContext = mReactInstanceManager.getCurrentReactContext();
            CatalystInstance instance = mContext.getCatalystInstance();

            loadForSystemOrAssets(instance,mContext);

            mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
            setContentView(mReactRootView);

        }

        mReactInstanceManager.createReactContextInBackground();
        return;
    }

    private void loadForSystemOrAssets ( CatalystInstance instance, ReactContext context  ) {
        String filePath$Name = "";
        // 是否有本地存储？
        Boolean hasCache = RNToolsManager.hasCache(getApplicationContext());
        String basePhat = RNToolsManager.currentVersionByBundleName(getApplicationContext()).get("moduleType");

        // 加载对应的 load
        if(hasCache){
            filePath$Name = getApplicationContext().getExternalFilesDir(null).getAbsolutePath() + "/Bundle/"+ basePhat + "/" + getJSBundleAssetName();
        }else{
            filePath$Name = "assets://" + getJSBundleAssetName();
        }


        if(!hasCache) {
            // loadScriptFromAssets FromAssets 不再适用
            ((CatalystInstanceImpl)instance).loadScriptFromAssets(context.getAssets(),filePath$Name ,false);
            return;
        }

            ((CatalystInstanceImpl)instance).loadSplitBundleFromFile( filePath$Name, filePath$Name);

    }

```

## RN

> RN 负责 主要的逻辑聚合 主要有下面的函数

// 首先是 这个 配置

```json
{
  "staging": {
    "bu1.android.bundle": "1.0.0",
    "bu2.android.bundle": "1.0.0",
    "index.android.bundle": "1.0.0"
  },
  "release": {
    "bu1.android.bundle": "1.0.0",
    "bu2.android.bundle": "1.0.0",
    "index.android.bundle": "1.0.0"
  },
  "key": "AAAA",
  "isStaging": true
}

```

// 然后是 自定义的工具函数

```js
import { useState } from 'react'
import { Platform, Alert, ToastAndroid  } from 'react-native'
import NativeModule from '../native'

// url and config
const useServerHot = ( props ) => {
  const { host,  versionInfo } = props
  const [loading, setLoading] = useState(true);

  const getData = async (version, module, type, key) => {
    const value = await fetch(
      `${host}/api/version_info?oldVersion=${version}&pageModule=${module}&type=${type}&appKey=${versionInfo.key}&platform=${Platform.OS.toUpperCase()}`
    );
    const data = await value.json();
    return data;
  };

  const CodePush = async () => {
    const UpperCaseType = versionInfo.isStaging ? "Staging" : "Release";
    
    // 获取是否DEV
    const isDebug = await NativeModule.getAndroidDEV();
  
    if (isDebug) {
      setLoading(false)
      return;
    }
  
    // 获取是否已经初始化到 cache 下
    const isInited = await NativeModule.isInited();
  
  
    // 是否完成文件夹的创建
    if (!isInited) {
      // cv 文件夹
      await NativeModule.writeFileFoRC(JSON.stringify(versionInfo));
    }
  
    // 遍历当前i模块是否是最新的版本 
    const promiseAllVersionInfo = [];
    const keys = versionInfo.isStaging ? "staging" : "release";
    Object.keys(versionInfo[keys]).forEach((it) => {
      promiseAllVersionInfo.push(
        NativeModule.getCurrentVersion(
          it,
          keys
        )
      );
    });
  
  
    const promiseAllIsLoadUpdate = [];  
    Promise.all(promiseAllVersionInfo).then(res => {
      res.forEach((it) => {
        promiseAllIsLoadUpdate.push(getData(it.version, it.module, UpperCaseType  , it.key, ));
      });  
      // 
      hasNewVersion()
    })
  
    const hasNewVersion = () => {
        // 更新和download 指定的版本
      Promise.all(promiseAllIsLoadUpdate).then((res) => {
            // 看看返回的数据 如果需要更新 就更新 并且重新写入新的数据
            const value = res
              .filter((data) => data.data?.isNeedRefresh)
              .map((r) => r.data);
  
            // 只有有一个人 isNeedRefresh = true 请弹窗 提示更新
            if (res.some((it) => it.data.isNeedRefresh)) {
              Alert.alert("有版本更新", "", [
                {
                  text: "更新",
                  onPress: updateVersion(value),
                },
              ]);
            }else{
              setLoading(false)
            }
            
        });
    }
  
  
  };


  // 更新成功 写入 正确的 最新的版本信息
  const updateVersion =  value => {
    return () => {
    const type = versionInfo.isStaging ? "staging" : "release";

      const allDownloadTask = [];
      value.forEach((it) => {
        allDownloadTask.push(
          NativeModule.downloadFiles(
            `${host}${it.downloadPathL}`,
            type,
            it.module
          )
        );
      });

      // 有多少更新 就重写多少次
      Promise.all(allDownloadTask).then(() => {
        value.forEach((it) => {
          NativeModule.setFileVersion(it.module, type , it.newVersion);
        });

        setTimeout(()=>{
          setLoading(false)
          ToastAndroid.show('更新成功 请重启应用', 1500)
        },2000)
      });
    }
  };

  return {
    CodePush,
    loading
  }
}

export default useServerHot
```

## 流程设计相关

> 请见同级别目录的 的drawio

## 重要细节

> 实际上我们缓存到cache 目录 会存在一定的安全问题，和资源加载问题，目前还没有更好的低成本处理方案

```java

// loadScriptFromAssets FromAssets 不再适用
      ((CatalystInstanceImpl)instance).loadScriptFromAssets(context.getAssets(),filePath$Name ,false);


// 不要用这个 因为会导致 你的 图片资源路径丢失
//                 ((CatalystInstanceImpl)instance).loadScriptFromFile(filePath$Name,filePath$Name ,false);

// 下面这个是正确的解决办法
//                  ((CatalystInstanceImpl)instance).loadSplitBundleFromFile( filePath$Name, filePath$Name);
```
