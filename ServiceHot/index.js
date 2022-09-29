const express = require("express");
const path = require("path");
const fs = require("fs");
const compressing = require("compressing");
const sqlite = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const multer = require("multer");

const dbPath = path.join(__dirname, "/SERVER_HOT");
const db = new sqlite.Database(dbPath);
const router_api = express.Router();
const app = express();
const { log } = console;

app.use(bodyParser.json());
app.use(multer({ dest: "./bundleFile" }).any());

const promiseQuery = (query) => {
  return new Promise((resolve, reject) => {
    db.all(query, (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const toZip = async (filename, filePath) => {
  return compressing.zip.compressFile(
    `${__dirname}/${filePath}`,
    `${__dirname}/public/${filename}`
  );
};

router_api.post("/create_app", async (req, res) => {
  const body = {
    appName: "",
    appDes: "",
    currentVersion: "",
    appKey: "",
    naive_version: "",
    ...req.body,
  };

  const oldData = await promiseQuery("select * from  APP_INFO");

  db.run(
    `INSERT INTO APP_INFO ( ID, APP_NAME, APP_DES, CURRENT_VERSION, APP_KEY, NATIVE_VERSION)
    VALUES (${oldData.length + 1}, '${body.appName}', '${body.appDes}', '${
      body.currentVersion
    }', '${body.appKey}', '${body.naive_version}')`,
    (err, row) => {
      res.json({
        data: null,
        success: true,
        message: "创建成功",
      });
    }
  );
});

router_api.post("/create_version_info", async (req, res) => {
  const body = {
    version: "",
    file_path: "",
    des: "",
    native_version: "",
    type: "",
    app_info_id: "",
    file_name: "",
    ...req.body,
  };

  const oldData = await promiseQuery("select * from  VERSION_INFO");
  db.run(
    `INSERT INTO VERSION_INFO (ID, VERSION, FILE_PATH, DES, NATIVE_VERSION, TYPE, APP_INFO_ID, FILENAME  )
    VALUES (${oldData.length + 1}, '${body.version}', '${body.file_path}', '${
      body.des
    }', '${body.native_version}', '${body.type}', ${body.app_info_id}, '${
      body.file_name
    }' )`,
    (err, row) => {
      res.json({
        data: null,
        success: true,
        message: "创建成功",
      });
    }
  );
});

router_api.post("/update_bundle", async (req, res) => {
  // 上传的文件在req.files中
  const version = req.query.version;
  const type = req.query.type;
  const filename = `bundleFile/${version}-${type}-${req.files[0].originalname}`;

  fs.rename(req.files[0].path, filename, async (err) => {
    if (err) {
      res.send({
        data: null,
        success: false,
        message: "上传失败",
      });
    } else {
      await toZip(
        `${version}-${type}-${req.files[0].originalname}.zip`,
        filename
      );
      res.send({
        data: {
          path: `/file/${version}-${type}-${req.files[0].originalname}.zip`,
          filename: `${version}-${type}-${req.files[0].originalname}.zip`,
        },
        success: true,
        message: "上传成功",
      });
    }
  });
});

router_api.get("/app_list", async (req, res) => {
  const data = await promiseQuery("select * from  APP_INFO");
  res.json(data);
});

router_api.get("/version_list", async (req, res) => {
  const data = await promiseQuery(
    `SELECT * FROM APP_INFO INNER JOIN VERSION_INFO ON APP_INFO.ID = VERSION_INFO.APP_INFO_ID WHERE APP_INFO.ID = ${req.query.id};`
  );
  res.json(data);
});

// 方便测试 删除清空表数据
router_api.delete("/cleanInfo", (req, res) => {
  db.run("DELETE FROM APP_INFO");
  db.run("DELETE FROM VERSION_INFO");
  res.json({
    data: null,
    success: true,
    message: "删除完成",
  });
});

// 更改当前 版本
router_api.get("/changer_version", async (req, res) => {
  const data = await promiseQuery(
    `UPDATE APP_INFO SET  CURRENT_VERSION = ${req.query.version} WHERE ID = ${req.query.id};`
  );
  res.json(data);
});

// 看看什么模块需要更新？ 这里有一个 优化点，目前要求所有模块的版本 都和 主模块版本保持一致 可以优化
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

  const oldVersionStr = `${params.oldVersion}-${params.type}-${params.pageModule}.zip`;

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

app.use("/api", router_api);

app.use("/files", express.static(path.join(__dirname, "public")));

app.listen(8085);
