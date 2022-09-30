# 说明

> 这里是SERVER_HOT 的设计 说明，希望可以帮助到你, 我知道这里的设计可能存在一些缺陷 ，但不要担心, 我后续会持续优化, 待优化的问题 (没有区分 不同模块的版本)

## 数据库设计

> 我们使用 sqlite3 它足够小型和简单，且可以随时移动

1. 创建数据库和表

```sql
CREATE TABLE APP_INFO(
  id INT PRIMARY KEY     NOT NULL,
  APP_NAME           CHAR(255)    NOT NULL,
  APP_DES            CHAR(255)     NOT NULL,
  CURRENT_VERSION        CHAR(255),
  APP_KEY         CHAR(255),
  NATIVE_VERSION         CHAR(255)

);

CREATE TABLE MODULE_INFO(
  ID INT PRIMARY KEY     NOT NULL,
  VERSION           CHAR(255)    NOT NULL,
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
  FILENAME     CHAR(255)
);

```

2. INSET 数据

```sql
INSERT INTO APP_INFO (ID,APP_NAME,APP_DES,CURRENT_VERSION,APP_KEY, NATIVE_VERSION )
VALUES (1, 'APP1', "我是一个APP", 'V1.0.0', "SHBISBOSD_*^&@SD_!@23", "V1.0.0" );

INSERT INTO VERSION_INFO (ID,VERSION, FILE_PATH, DES, NATIVE_VERSION, TYPE, APP_INFO_ID  )
VALUES (1, 'V1.0.0', "/bu1.zip", 'DESDES_VERSION', "V1.0.0", "Staging", 1 )

INSERT INTO VERSION_INFO (ID,VERSION, FILE_PATH, DES, NATIVE_VERSION, TYPE, APP_INFO_ID  )
VALUES (2, 'V1.0.1', "/bu1.zip", 'DESDES_VERSION', "V1.0.0", "Staging", 1 )

INSERT INTO VERSION_INFO (ID,VERSION, FILE_PATH, DES, NATIVE_VERSION, TYPE, APP_INFO_ID  )
VALUES (3, 'V1.0.2', "/bu1.zip", 'DESDES_VERSION', "V1.0.0", "Staging", 1 )

INSERT INTO VERSION_INFO (ID, VERSION, FILE_PATH, DES, NATIVE_VERSION, TYPE, APP_INFO_ID, FILENAME  )
VALUES (2, 'v1.0.0,', "/file/v1.0.0-bu1.android.bundle.zip", '更新222', "v1.0.0", "Staging", 1, 'v1.0.0-bu1.android.bundle.zip' )
```

3. 查询 和 删除数据

```sql
SELECT * FROM APP_INFO;

SELECT VERSION, APP_NAME, FILE_PATH, DES, TYPE FROM APP_INFO INNER JOIN VERSION_INFO ON APP_INFO.ID = VERSION_INFO.APP_INFO_ID;

DELETE FROM APP_INFO
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

1. 首先是加载的时候 判断是否 dev
2. 在判断有没有本地数据
   2.1 创建文件夹
   2.2 cv 嗯就
   2.3 创建version.JSON

```json
  {
    "staging":{
      "bu1.android.bundle":"v1.0.0",
      "bu2.android.bundle":"v1.0.0",
      "index.android.bundle":"v1.0.0",
    },
    "release":{
      "bu1.android.bundle":"v1.0.0",
      "bu2.android.bundle":"v1.0.0",
      "index.android.bundle":"v1.0.0",
    },
    "key":"AAAA",
    "isStaging": true
  }
```

3. 请求看看 是否需要更新
  3.1 下载最新文件
  3.2 解压和替换
  3.3 更新替换 version.json
  3.4 重启APP
4. 依据staging 载入data bundle

## RN

## 使用前的重要说明

1. 一定一定，在发native 包之前 把 所有的bu业务包都上传的平台  并且 创建好了所有的版本信息
2. 本次主要采取的全量更新的方式 （增量更新 有机会再完善吧 主要是调整一下接口就好了 ，当然表设计也得改

```java

            // loadScriptFromAssets FromAssets 不再适用
                  ((CatalystInstanceImpl)instance).loadScriptFromAssets(context.getAssets(),filePath$Name ,false);


                // 不要用这个 因为会导致 你的 图片资源路径丢失
//                 ((CatalystInstanceImpl)instance).loadScriptFromFile(filePath$Name,filePath$Name ,false);

// 下面这个是正确的解决办法
//                  ((CatalystInstanceImpl)instance).loadSplitBundleFromFile( filePath$Name, filePath$Name);

```
