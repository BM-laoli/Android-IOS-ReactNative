import { NativeModules } from "react-native";

if (!NativeModules.RNToolsManager) {
  throw new Error("native模块加载失败");
}

const RNToolsManager = {
  changeActivity: (value) => {
    return NativeModules.RNToolsManager.changeActivity(value, null);
  },
  writeFileFoRC: () => {
    return NativeModules.RNToolsManager.writeFileFoRC();
  },
  cleanFileByPath: () => {
    return NativeModules.RNToolsManager.cleanFileByPath();
  },
  downloadFiles: () => {
    return NativeModules.RNToolsManager.downloadFiles();
  },
  touchZip: () => {
    return NativeModules.RNToolsManager.touchZip();
  },
};

export default RNToolsManager;
