const express = require("express");
const path = require("path");
const fs = require("fs")
const compressing = require("compressing");
const sqlite = require("sqlite3").verbose();
const bodyParser = require('body-parser')
const multer = require('multer')

const dbPath = path.join(__dirname, "/SERVER_HOT");
const db = new sqlite.Database(dbPath);
const router_api = express.Router();
const app = express();

app.use(bodyParser.json());
app.use(multer({ dest: './bundleFile' }).any());

const promiseQuery = (query) => {
  return  new Promise((resolve , reject) => {
      db.all( query , (err, res) => {
        if(err)  reject(err)
        resolve(res)
      })
  })
}

const toZip = async  (filename, filePath) => {
   return compressing.zip.compressFile( `${__dirname}/${filePath}`,  `${__dirname}/public/${filename}`)
}

router_api.post('/create_app', async ( req, res ) => {
  const body = {
    appName:"",
    appDes:"",
    currentVersion:"",
    appKey:"",
    naive_version:"",
    ...req.body,
  };

  const oldData = await promiseQuery("select * from  APP_INFO");

  db.run(
    `INSERT INTO APP_INFO ( ID, APP_NAME, APP_DES, CURRENT_VERSION, APP_KEY, NATIVE_VERSION)
    VALUES (${oldData.length+1}, '${body.appName}', '${body.appDes}', '${body.currentVersion}', '${body.appKey}', '${body.naive_version}')` ,  (err, row) => {

          res.json({
            data: null,
            success: true,
            message: "创建成功",
          })

    });
  
});

router_api.post('/create_version_info', async ( req, res ) => {
  
  const body = {
    version:"",
    file_path:"",
    des:"",
    native_version:"",
    type:"",
    app_info_id: "",
    file_name: "",
    ...req.body,
  };
  
  const oldData = await promiseQuery("select * from  VERSION_INFO");
  db.run(
    `INSERT INTO VERSION_INFO (ID, VERSION, FILE_PATH, DES, NATIVE_VERSION, TYPE, APP_INFO_ID, FILENAME  )
    VALUES (${oldData.length+1}, '${body.version}', '${body.file_path}', '${body.des}', '${body.native_version}', '${body.type}', ${body.app_info_id}, '${body.file_name}' )`,  (err, row) => {
        res.json({
            data: null,
            success: true,
            message: "创建成功",
          })
  });

});

router_api.post('/update_bundle', async ( req, res ) => {
  
  // 上传的文件在req.files中
  const version = req.query.version;
  const filename = `bundleFile/${version}-${req.files[0].originalname}`
  
  fs.rename(req.files[0].path, filename, async (err) => {
    if(err){
      res.send({
        data: null,
        success: false,
        message: "上传失败",
      })
    }else{
      await toZip(`${version}-${req.files[0].originalname}.zip`, filename )
      res.send({
        data: {
          path: `/file/${version}-${req.files[0].originalname}.zip`, 
          filename: `${version}-${req.files[0].originalname}.zip`
        },
        success: true,
        message: "上传成功",
      })
    }
  })


});

router_api.get('/app_list', async ( req, res ) => {
  const data = await promiseQuery("select * from  APP_INFO");
  res.json(data);
});

router_api.get('/version_list', async ( req, res ) => {

  const data = await promiseQuery(
    `SELECT VERSION, APP_NAME, FILE_PATH, DES, TYPE FROM APP_INFO INNER JOIN VERSION_INFO ON APP_INFO.ID = VERSION_INFO.APP_INFO_ID WHERE APP_INFO.ID = ${req.query.id};`
  );
  res.json(data);
});

// 方便测试 删除清空表数据
router_api.delete('/cleanInfo', (req,res) => {
  
})

// 看看什么模块需要更新？
// 参数: 当前手机的VERSION，文件名(模块名)， 放回：服务器最新的包 版本，
router_api.get('/version_info', ( req, res ) => {
  // res.json(767);
});



app.use('/api', router_api );


app.use( 'file' , express.static(path.join(__dirname, "public")));

app.listen(8085);

