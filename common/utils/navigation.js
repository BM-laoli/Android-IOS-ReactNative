import storageApp from  './storage';
import RNToolsManager from '../native';

const pushToActivity  =  (activity, params) => {
  storageApp.save({
    key:"MessageActivity",
    data: params,
    expires: 1000 * 3600
  })

  const _pre_fix = "com.example.myapprnn.";
  RNToolsManager.changeActivity(_pre_fix + activity);
}

const getFromActivity =  () => {
  return new Promise((resolve, reject) => {
    storageApp.load({
      key:"MessageActivity",
      autoSync:true,
    }).then((data) => {
       
      resolve(data)

    }).catch(() => {
      
      reject("error")

    }).finally(() => {
 
    })

  })
} 

export  {
  pushToActivity,
  getFromActivity
}