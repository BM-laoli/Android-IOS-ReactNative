const { useState, useEffect, useReducer, useRef } = React;
const http = axios.create({
  baseURL: "http://localhost:8085/api/",
  timeout: 2000,
});
const VersionTypeList = (props) => {
  const { currentTypeList, toVersionList, setRouter } = props;
  const [type, setType] = useState("ANDROID");

  return (
    <div className="list-container">
      <div className="list-item">
        <button
          className="item-btn"
          onClick={() => {
            setRouter("/home");
          }}
        >
          返回
        </button>

        <button
          className="item-btn"
          onClick={() => {
            setType("ANDROID");
          }}
        >
          Android
        </button>
        <button
          className="item-btn"
          onClick={() => {
            setType("IOS");
          }}
        >
          IOS
        </button>
      </div>
      {currentTypeList
        .filter((it) => it.PLATFORM === type)
        .map((item, index) => {
          return (
            <div className="list-item" key={index}>
              <div className="item-span">{item.ID}</div>
              <div className="item-span">{item.MODULE}</div>
              <div className="item-span">{item.PLATFORM}</div>
              <button
                className="item-btn"
                onClick={() => {
                  toVersionList(item);
                }}
              >
                前往模块列表
              </button>
            </div>
          );
        })}
    </div>
  );
};

const VersionList = (props) => {
  const { versionList, setRouter, setActiveVersion } = props;
  const [type, setType] = useState("Staging");

  console.log('versionList',versionList);

  return (
    <div className="list-container">
      <div className="list-item">
        <button
          className="item-btn"
          onClick={() => {
            setRouter("/versionTypeList");
          }}
        >
          返回x
        </button>
        <button
          className="item-btn"
          onClick={() => {
            setType("Release");
          }}
        >
          Release
        </button>
        <button
          className="item-btn"
          onClick={() => {
            setType("Staging");
          }}
        >
          Staging
        </button>
      </div>
      {versionList
        .filter((it) => it.TYPE === type)
        .map((item, index) => {
          return (
            <div className="list-item" key={index}>
              <div className="item-span">{item.MODULE}</div>
              <div className="item-span">{item.VERSION}</div>
              <div className="item-span">{item.FILE_PATH}</div>
              <div className="item-span">{item.FILENAME}</div>
              <div className="item-span">{ Boolean(item.IS_ACTIVE) &&  "Active" }</div>
              <button
                className="item-btn"
                onClick={() => {
                  const oldID = versionList
                    .filter((it) => it.TYPE === type)
                    .find((i) => Boolean(i.IS_ACTIVE))?.ID;
                    console.log('--->', oldID)
                  setActiveVersion({ old_id: oldID , id: item.ID });
                  
                }}
              >
                设置为当前版本
              </button>
            </div>
          );
        })}
    </div>
  );
};

const AppList = (props) => {
  const { list, toTypeList } = props;
  return (
    <div className="list-container">
      <div className="list-item" >
        <div className="item-span">名称</div>
        <div className="item-span">介绍</div>
        <div className="item-span">KEY</div>
        <div className="item-span">当前Native 版本</div>
        <div className="item-span">操作</div>
      </div>
      {list.map((item, index) => {
        return (
          <div className="list-item" key={index}>
            <div className="item-span">{item.APP_NAME}</div>
            <div className="item-span">{item.APP_DES}</div>
            <div className="item-span">{item.APP_KEY}</div>
            <div className="item-span">{item.NATIVE_VERSION}</div>
            <button
              className="item-btn"
              onClick={() => {
                toTypeList(item);
              }}
            >
              前往模块列表
            </button>
          </div>
        );
      })}
    </div>
  );
};

// 创建APP
const CreateAPPForm = (props) => {
  const { create } = props;
  const createApp = () => {
    const data = {
      appName: document.forms["createApp"]["appName"].value,
      appDes: document.forms["createApp"]["appDes"].value,
      currentVersion: document.forms["createApp"]["currentVersion"].value,
      appKey: document.forms["createApp"]["appKey"].value,
      naive_version: document.forms["createApp"]["naive_version"].value,
    };
    create(data);
  };

  return (
    <div>
      <form
        action=""
        target="frameName"
        name="createApp"
        onSubmit={(e) => {
          console.log("e", e);
          createApp();
        }}
      >
        <div class="form-example">
          <label for="appName">appName: </label>
          <input type="text" name="appName" id="appName" required />
        </div>

        <div class="form-example">
          <label for="appDes">appDes: </label>
          <input type="text" name="appDes" id="appDes" required />
        </div>

        <div class="form-example">
          <label for="currentVersion">currentVersion: </label>
          <input
            type="text"
            name="currentVersion"
            id="currentVersion"
            required
          />
        </div>

        <div class="form-example">
          <label for="appKey">appKey: </label>
          <input type="text" name="appKey" id="appKey" required />
        </div>

        <div class="form-example">
          <label for="naive_version">naive_version: </label>
          <input type="text" name="naive_version" id="naive_version" required />
        </div>

        <div class="form-example">
          <input type="submit" />
        </div>
      </form>
    </div>
  );
};

// 创建模块
const CreateModule = (props) => {
  const { create, currentApp } = props;
  const createModule = () => {
    const data = {
      module: document.forms["CreateModule"]["module"].value,
      platform: document.forms["CreateModule"]["platform"].value,
      app_id: currentApp.ID,
    };
    create(data);
  };

  return (
    <div>
      <form
        action=""
        target="frameName"
        name="CreateModule"
        onSubmit={createModule}
      >
        <div class="form-example">
          <label for="module">MODULE: </label>
          <input type="text" name="module" id="module" required />
        </div>

        <div class="form-example">
          <label for="platform">PLATFORM: </label>
          <input type="text" name="platform" id="platform" required />
        </div>

        <div class="form-example">
          <input type="submit" />
        </div>
      </form>
    </div>
  );
};

// 创建版本
const CreateVersionForm = (props) => {
  const { create, currentModule } = props;
  const [preState, setState] = useState({
    file_name: "",
    file_path: "",
    type: "",
  });
  const createApp = () => {
    const data = {
      version: document.forms["CreateVersionForm"]["version"].value,
      file_path: preState.file_path,
      des: document.forms["CreateVersionForm"]["des"].value,
      type: preState.type,
      module_id: currentModule.ID,
      is_active: 0, // 0 || 1
      file_name: preState.file_name,
    };
    create(data);
  };

  const onUpdate =  async (e) => {
    if( !e.target.files.length ) return;

    const files = e.target.files[0];
    const formData = new FormData();
    formData.append("files", files);
    const version = document.forms["CreateVersionForm"]["version"].value
    const data = await http.post(
      `/update_bundle?version=${version}&type=${preState.type}`,
      formData,
      {
        "Content-Type": "multipart/form-data;charset=utf-8",
      }
    );

    setState((old) => ({
      ...old,
      file_name: data.data.data.filename,
      file_path: data.data.data.path,
    }));
  };

  return (
    <div>
      <form
        action=""
        target="frameName"
        name="CreateVersionForm"
        // onSubmit={(e) => {
          
        // }}
      >
        <div class="form-example">
          <label for="version">version: </label>
          <input type="text" name="version" id="version" required />
        </div>

        <div class="form-example">
          <label for="des">des: </label>
          <input type="text" name="des" id="des" required />
        </div>

        {/* <div class="form-example">
          <input type="submit" />
        </div> */}
      </form>

      <div class="form-example">
        <label for="type">isStaging?</label>
        <input
          type="checkbox"
          name="type"
          onChange={(e) => {
            setState((old) => ({
              ...old,
              type: e.target.checked ? "Staging" : "Release",
            }));
          }}
        ></input>
      </div>

      <div class="form-example">
        <label for="file">file: </label>
        <input
          id="file"
          onChange={onUpdate}
          type="file"
          name="file"
          multiple="multiple"
        ></input>
      </div>
      <button onClick={createApp}>submit</button>
    </div>
  );
};

const initAppInfo = {
  appList: [],
  currentTypeList: [],
  currentTypeVersionList: [],

  currentModule: {},
  currentApp: {},
};

const reducer = (prevState, action) => {
  const { type, state } = action;
  switch (type) {
    case "APP_LIST":
      return { ...prevState, appList: state };
    case "CURRENT_TYPE":
      return {
        ...prevState,
        currentTypeList: state,
      };
    case "CURRENT_TYPE_VERSION_LIST":
      return {
        ...prevState,
        currentTypeVersionList: state,
      };
    case "CURRENT_MODULE":
      return {
        ...prevState,
        currentModule: state,
      };
    case "CURRENT_APP":
      return {
        ...prevState,
        currentApp: state,
      };
    default:
      return { ...prevState };
  }
};

const App = () => {
  const [appStatus, dispatchDispatch] = useReducer(reducer, initAppInfo);
  const [router, setRouter] = useState("/home");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const value = await http.get("/app_list");
    dispatchDispatch({
      type: "APP_LIST",
      state: value.data.data,
    });
  };

  const routerChanger = (path) => {
    // path /home /versionTypeList /versionList
    setRouter(path);
  };

  const toTypeList = async (item) => {
    // const value = await http.get("/app_list");
    dispatchDispatch({
      type: "CURRENT_APP",
      state: item,
    });
    await loadModule(item.ID);
    routerChanger("/versionTypeList");
  };

  const toVersionList = async (item) => {
    dispatchDispatch({
      type: "CURRENT_MODULE",
      state: item,
    });
    await loadVersion(item.ID);
    routerChanger("/versionList");
  };

  // createApp
  const create = async (data) => {
    await http.post("/create_app", data);
    await await init();
  };

  const createModule = async (data) => {
    await http.post("/create_module", data);
    await loadModule()
  };

  const createVersion = async (data) => {
    await http.post("/create_version_info", data);
    await  loadVersion()
  };

  const setActiveVersion = async (data) => {
    const { old_id, id } = data;
    await http.put(`/update_active_bundle`,data);
    await  loadVersion()
  };

  const loadModule = async (id) => {
    const value = await http.get(
      `/module_list?id=${id || appStatus.currentApp.ID || 1}`
    );
    dispatchDispatch({
      type: "CURRENT_TYPE",
      state: value.data.data,
    });
  };

  const loadVersion = async (id) => {
    const value = await http.get(
      `/version_list?id=${id || appStatus.currentModule.ID || 1}`
    );
    dispatchDispatch({
      type: "CURRENT_TYPE_VERSION_LIST",
      state: value.data.data,
    });
  };



  return (
    <div className="app-container">
      <div className="app-header">
        {router === "/home" && "APP列表"}
        {router === "/versionTypeList" && "APP所有模块"}
        {router === "/versionList" && "APP模块Version列表"}
      </div>
      <div className="app-center">
        {router === "/home" && (
          <AppList
            setRouter={setRouter}
            list={appStatus.appList}
            toTypeList={toTypeList}
            routerChanger={routerChanger}
          ></AppList>
        )}

        {router === "/versionTypeList" && (
          <VersionTypeList
            setRouter={setRouter}
            currentTypeList={appStatus.currentTypeList}
            toVersionList={toVersionList}
          ></VersionTypeList>
        )}
        {router === "/versionList" && (
          <VersionList
            setActiveVersion={setActiveVersion}
            setRouter={setRouter}
            versionList={appStatus.currentTypeVersionList}
          ></VersionList>
        )}
      </div>

      {/* 创建APP / 上传文件 /创建新版本 */}
      <div className="form-container">
        <iframe src="" frameborder="0" name="frameName"></iframe>
        <CreateAPPForm create={create}></CreateAPPForm>
        <CreateModule
          currentApp={appStatus.currentApp}
          create={createModule}
        ></CreateModule>
        <CreateVersionForm
          currentModule={appStatus.currentModule}
          create={createVersion}
        ></CreateVersionForm>
      </div>
    </div>
  );
};

// 挂载，
ReactDOM.render(<App />, document.getElementById("app"));
