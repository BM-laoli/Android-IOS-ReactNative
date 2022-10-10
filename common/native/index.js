import { NativeModules, Platform } from "react-native";

if (!NativeModules.RNToolsManager) {
  throw new Error("native模块加载失败");
}

const RNToolsManager = {
  changeActivity: (value) => {
    // 此处可以优化 把名字全部统一，只需要确定一个规则 path 为 [moduleName].[platform].bundle
    // 比如 common.ios.bundle, IO2.ios.bundle, common.android.bundle, IO2.android.bundle, 
    // 参数只需要 传递 IO2 就好了这个IOS2 应该和模块的 registerComponent name 保持一致！
    if(Platform.OS === 'ios') {
      return NativeModules.RNToolsManager.changeActivity(`bundle/${value}.ios`, value); 
    }
    return NativeModules.RNToolsManager.changeActivity(value, null);
  },
  writeFileFoRC: (versionMapInfo) => {
    return NativeModules.RNToolsManager.writeFileFoRC(versionMapInfo);
  },
  cleanFileByPath: () => {
    return NativeModules.RNToolsManager.cleanFileByPath();
  },
  downloadFiles: (url, type, module) => {
    return NativeModules.RNToolsManager.downloadFiles(url, type, module);
  },
  touchZip: () => {
    return NativeModules.RNToolsManager.touchZip();
  },
  getAndroidDEV: async () => {
    return NativeModules.RNToolsManager.getAndroidDEV();
  },
  isInited: async () => {
    return NativeModules.RNToolsManager.isInited();
  },
  getCurrentVersion: async (module, type) => {
    return NativeModules.RNToolsManager.getCurrentVersion(module, type);
  },
  setFileVersion: async (module, type, newVersion) => {
    return NativeModules.RNToolsManager.setFileVersion(
      module,
      type,
      newVersion
    );
  },
};

export default RNToolsManager;
