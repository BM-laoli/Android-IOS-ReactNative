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

// 创建
router_api.post("/create_app", async (req, res) => {
  const body = {
    appName: "",
    appDes: "",
    currentVersion: "",
    appKey: "",
    naive_version: "",
    ...req.body,
  };

  const oldData = await promiseQuery("SELECT * from  APP_INFO");

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

router_api.post("/create_module", async (req, res) => {
  const body = {
    module: "",
    platform: "",
    app_id: "",
    ...req.body,
  };

  const oldData = await promiseQuery("SELECT * from  MODULE_INFO");

  db.run(
    `INSERT INTO MODULE_INFO ( ID, MODULE, PLATFORM, APP_INFO_ID)
      VALUES (${oldData.length + 1}, '${body.module}','${body.platform}', '${
      body.app_id
    }')`,
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
    type: "",
    module_id: "",
    is_active: "",
    file_name: "",
    ...req.body,
  };

  const oldData = await promiseQuery("SELECT * from  VERSION_INFO");
  db.run(
    `INSERT INTO VERSION_INFO (ID, VERSION, FILE_PATH, DES, TYPE, MODULE_ID, IS_ACTIVE, FILENAME  )
    VALUES (${oldData.length + 1}, '${body.version}', '${body.file_path}', '${
      body.des
    }', '${body.type}', '${body.module_id}', ${body.is_active}, '${
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

// 获取
router_api.get("/app_list", async (req, res) => {
  const data = await promiseQuery("SELECT * from  APP_INFO");
  res.json({
    data: data,
    success: true,
    message: "",
  });
});

router_api.get("/module_list", async (req, res) => {
  const data = await promiseQuery(
    `SELECT * from  MODULE_INFO WHERE APP_INFO_ID = ${req.query.id}`
  );
  res.json({
    data: data,
    success: true,
    message: "",
  });
});

router_api.get("/version_list", async (req, res) => {
  const data = await promiseQuery(
    `SELECT  * FROM 
     MODULE_INFO INNER JOIN VERSION_INFO 
     ON MODULE_INFO.ID = VERSION_INFO.MODULE_ID WHERE MODULE_ID = ${req.query.id};`
  );
  res.json({
    data: data,
    success: true,
    message: "",
  });
});

// 修改 成当前活动的模块
router_api.put("/update_active_bundle", async (req, res) => {
  // 清空其它的  其实这个做法不好，有机会你们可以优化优化
  db.run(
    `
    UPDATE VERSION_INFO SET IS_ACTIVE = 0 WHERE ID=${req.body.old_id}
  `,
    (err, it) => {
      // 设置自己的
      db.run(`
UPDATE VERSION_INFO SET IS_ACTIVE = 1 WHERE ID=${req.body.id}
`);
      res.json({
        data: null,
        success: true,
        message: "修改成功",
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

// 方便清除测试数据
router_api.delete("/cleanInfo", (req, res) => {
  db.run("DELETE FROM APP_INFO");
  db.run("DELETE FROM VERSION_INFO");
  db.run("DELETE FROM MODULE_INFO");
  res.json({
    data: null,
    success: true,
    message: "删除完成",
  });
});

// 给APP 的 API 用于判断 是否需要升级 ......todo
router_api.get("/version_info", async (req, res) => {
  const params = {
    oldVersion: "",
    pageModule: "",
    type: "",
    appKey: "",
    platform:"",
    ...req.query,
  };
  // 查询到当前的APP
  const appInfo = await promiseQuery(
    `SELECT * FROM APP_INFO WHERE APP_KEY = '${params.appKey}'`
  );

  // 查询到当前的模块 ( 指定平台  )
  const moduleInfo = await promiseQuery(
    `SELECT  *  FROM APP_INFO INNER JOIN MODULE_INFO ON APP_INFO.ID=MODULE_INFO.APP_INFO_ID WHERE APP_INFO_ID=${appInfo[0].ID} AND PLATFORM='${params.platform}' AND MODULE = '${params.pageModule}'`
  )
  
  // 查询当前 module 下的 指定type 下的  active 的版本
  const activeVersion = await promiseQuery(
    `SELECT  *  FROM MODULE_INFO INNER JOIN VERSION_INFO ON MODULE_INFO.ID=VERSION_INFO.MODULE_ID  WHERE MODULE_ID=${moduleInfo[0].ID} AND TYPE='${params.type}' AND IS_ACTIVE=1`
  )


  // 对比是否需要更新 当前版本
  if(!activeVersion.length) {
    res.json({ 
      data: {
        isNeedRefresh: false,
      },
      success: true,
      message: "当前版本一致 不需要更新",
    })
    return
  }

  if  (activeVersion[0].VERSION === params.oldVersion  )  {
    res.json({
      data: {
        isNeedRefresh: false,
      },
      success: true,
      message: "当前版本一致 不需要更新",
    });
    return;
  }

  res.json({
    data: {
      newVersion: activeVersion[0].VERSION,
      downloadPathL: activeVersion[0].FILE_PATH,
      module: activeVersion[0].MODULE,
      type: activeVersion[0].TYPE,
      isNeedRefresh: true,
    },
    success: true,
    message: "请更新你的版本",
  });
});

app.use("/api", router_api);

app.use("/file", express.static(path.join(__dirname, "public")));

app.listen(8085);
