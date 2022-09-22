import { NativeModules } from 'react-native'

if ( !NativeModules.RNToolsManager) {
  throw new Error('native模块加载失败');
}

const RNToolsManager = {
  changeActivity : (value) => {
    return NativeModules.RNToolsManager.changeActivity(value,null)
  }
}

export default RNToolsManager