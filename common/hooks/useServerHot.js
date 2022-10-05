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