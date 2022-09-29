import { NativeModules } from "react-native";

if (!NativeModules.RNToolsManager) {
  throw new Error("native模块加载失败");
}

const RNToolsManager = {
  changeActivity: (value) => {
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
