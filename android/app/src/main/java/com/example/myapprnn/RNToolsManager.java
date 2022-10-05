package com.example.myapprnn;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Environment;
import android.util.Log;


import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONObject;
import org.json.JSONStringer;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.Reader;
import java.net.URL;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class RNToolsManager extends ReactContextBaseJavaModule {
    public static final String EXTRA_MESSAGE = "MESSAGE";
    public static final String TAG = "INFO__JONEY";
    private static final int WRITE_BUFFER_SIZE = 1024 * 8;

    private ReactApplicationContext reactContext;

    public RNToolsManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNToolsManager";
    }

    /**
     * 实现rn -> 切换Activity 注意 参数我们使用json string 虽然提供了 方法让你 传数据，但是不建议 业务是不同Bu业务
     * @param name
     * @param params
     */
    @ReactMethod
    public void changeActivity (String name,String params) {
        try{
            Activity currentActivity = getCurrentActivity();
            if(currentActivity != null){
                Class toActivity = Class.forName(name);
                Intent intent = new Intent(currentActivity,toActivity);
                intent.putExtra(EXTRA_MESSAGE, params);
                currentActivity.startActivity(intent);
            }
        }catch (Exception e) {
            throw new JSApplicationIllegalArgumentException(
                    "不能打开Activity : "+e.getMessage());
        }
    }

    @ReactMethod
    public void getAndroidDEV (Promise promise) {
        promise.resolve(BuildConfig.DEBUG);
    };

    public void createVersionInfo(String jversion){
            String path = reactContext.getExternalFilesDir(null).getAbsolutePath();
            File files = new File(path);

            if (!files.exists()) {
                files.mkdirs();
            }
            if (files.exists()) {
                try {
                    FileWriter fw = new FileWriter(path + File.separator
                            +"version.json");
                    fw.write(jversion);
                    Log.i(TAG, "createVersionInfo: jversion" + jversion);
                    fw.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
    };

    // CV 文件 和创建初试文件
    @ReactMethod
    public void writeFileFoRC (String jversion) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath();

        // 创建version.json
        createVersionInfo(jversion);

        // 新建文件夹 /Bundle/staging 和/Bundle/release 并且完成CV
        createDir(path + "/Bundle/staging/");
        createDir(path + "/Bundle/release/");
        try {
            String fileNames[] = reactContext.getAssets().list("");
            for(String fileName: fileNames) {
                if(fileName.indexOf(".bundle") > 0) {
                    CopyAssets(reactContext,fileName, path + "/Bundle/staging/" + fileName);
                    CopyAssets(reactContext,fileName, path + "/Bundle/release/" + fileName);
                }
            }

        }catch (IOException ioe) {
            Log.i(TAG, "writeFileFoRC: "+ioe);
        }
    }

    // 配置文件是否完成创建
    @ReactMethod
    public void isInited (Promise promise){
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath();
        File file = new File(path + "/version.json");
        // 如果有值 就不要重复创建了
        if(  file.exists()  ){
            promise.resolve(true);
        }else{
            promise.resolve(false);
        }
    }

    // 返回 最新 本地的info信息
    @ReactMethod
    public  void getCurrentVersion (String module,String type, Promise promise) {
        Map<String,String> versionInfo = currentVersionByBundleName(reactContext,module,type);
        WritableMap map = Arguments.createMap();

        map.putString("module", module);
        map.putString("version",versionInfo.get("version") );
        map.putString("type",versionInfo.get("type") );
        map.putString("key", versionInfo.get("key") );

        promise.resolve(map);
        return;
    }

    // 更新本地INFO for JSONFILE 信息
    @ReactMethod
    public void setFileVersion (String module,String type,String newVersion ) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/version.json";
        StringBuilder sb = new StringBuilder();
        try {
            File file = new File(path);
            InputStream in = null;
            in = new FileInputStream(file);
            int tempbyte;
            while ((tempbyte = in.read()) != -1) {
                sb.append((char) tempbyte);
            }
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            JSONObject versionJSON = new JSONObject(sb.toString());
            JSONObject typeVersionJObject = versionJSON.getJSONObject(type);
            typeVersionJObject.put(module,newVersion);

            // 重新创建
            createVersionInfo(versionJSON.toString());

        }catch (Exception e) {

        }


    }

    // 删除某路径下的所有文件 String path 先不传
    @ReactMethod
    public void cleanFileByPath () {

        String filePath$Name = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/Bundle/staging/bu2.android.bundle";
            File file = new File(filePath$Name);
            // 如果文件路径所对应的文件存在，并且是一个文件，则直接删除
            if (file.exists() && file.isFile()) {
                if (file.delete()) {
                    Log.i(TAG, "cleanFileByPath: 删除成功 " + filePath$Name);
                } else {
                    Log.i(TAG, "cleanFileByPath: 删除失败 " + filePath$Name);
                }
            } else {
                Log.i(TAG, "cleanFileByPath: 文件不存在 " + filePath$Name);
            }
    }

    // 自己下载文件并且解压且替换
    @ReactMethod
    public void downloadFiles (String downloadUrl, String type,String module, Promise promise) {
        try{
            //下载路径，如果路径无效了，可换成你的下载路径
            String url = downloadUrl;
            String path = reactContext.getExternalFilesDir(null).getAbsolutePath();

            // 要下载到的路径
            String downPath = path +"/Bundle/" + type + "/";
            String modulePath = path +"/Bundle/" + type + "/" + module;


            final long startTime = System.currentTimeMillis();

            //下载函数
            String filename=url.substring(url.lastIndexOf("/") + 1);
            //获取文件名
            URL myURL = new URL(url);
            URLConnection conn = myURL.openConnection();
            conn.connect();
            InputStream is = conn.getInputStream();
            int fileSize = conn.getContentLength();//根据响应获取文件大小
            if (fileSize <= 0) throw new RuntimeException("无法获知文件大小 ");
            if (is == null) throw new RuntimeException("stream is null");
            File file1 = new File(path);
            if(!file1.exists()){
                file1.mkdirs();
            }
            //把数据存入路径+文件名
            FileOutputStream fos = new FileOutputStream(downPath+filename);
            byte buf[] = new byte[1024];
            int downLoadFileSize = 0;
            do{
                //循环读取
                int numread = is.read(buf);
                if (numread == -1)
                {
                    break;
                }
                fos.write(buf, 0, numread);
                downLoadFileSize += numread;
                //更新进度条
            } while (true);

            Log.i("DOWNLOAD","download success");
            Log.i("DOWNLOAD","totalTime="+ (System.currentTimeMillis() - startTime));

            promise.resolve("成功");
            touchZip(downPath+filename, downPath,modulePath);

            is.close();
        } catch (Exception ex) {
            Log.e("DOWNLOAD", "error: " + ex.getMessage(), ex);
        }
    }

    public static void deleteFileOrFolderSilently(File file) {
        if (file.isDirectory()) {
            File[] files = file.listFiles();
            for (File fileEntry : files) {
                if (fileEntry.isDirectory()) {
                    deleteFileOrFolderSilently(fileEntry);
                } else {
                    fileEntry.delete();
                }
            }
        }

        if (!file.delete()) {
            Log.e(TAG, "deleteFileOrFolderSilently: ");
        }
    }

    public void touchZip (String filePath, String downPath, String modulePath) {
        // zip地址
        File zipFile = new File(filePath);
        File oldModuleFile = new File(modulePath);

        // 解压缩目标地址
        String destination = downPath;

        // 删除旧的版本
        deleteFileOrFolderSilently(oldModuleFile);

        FileInputStream fileStream = null;
        BufferedInputStream bufferedStream = null;
        ZipInputStream zipStream = null;
        try {
            fileStream = new FileInputStream(zipFile);
            bufferedStream = new BufferedInputStream(fileStream);
            zipStream = new ZipInputStream(bufferedStream);
            ZipEntry entry;

            File destinationFolder = new File(destination);

            destinationFolder.mkdirs();

            byte[] buffer = new byte[WRITE_BUFFER_SIZE];
            while ((entry = zipStream.getNextEntry()) != null) {
//                String fileName = validateFileName(entry.getName(), destinationFolder);

                File file = new File(modulePath);
                if (entry.isDirectory()) {
                    file.mkdirs();
                } else {
                    File parent = file.getParentFile();
                    if (!parent.exists()) {
                        parent.mkdirs();
                    }

                    FileOutputStream fout = new FileOutputStream(file);
                    try {
                        int numBytesRead;
                        while ((numBytesRead = zipStream.read(buffer)) != -1) {
                            fout.write(buffer, 0, numBytesRead);
                        }
                    } finally {
                        fout.close();
                    }
                }
                long time = entry.getTime();
                if (time > 0) {
                    file.setLastModified(time);
                }
            }
            if (zipStream != null) zipStream.close();
            if (bufferedStream != null) bufferedStream.close();
            if (fileStream != null) fileStream.close();

            if (destinationFolder.exists()) {
                //  删除你下载的zip
                deleteFileOrFolderSilently(zipFile);
            }

        } catch (IOException ioe){
            Log.i(TAG, "touchZip: ioe"+ ioe);
        }
    }

    public void createDir(String filePath) {
        File file = new File(filePath);

        if (file.exists()) {
            Log.i(TAG, "文件夹以及存在");
        }
        if (filePath.endsWith(File.separator)) {// 以 路径分隔符 结束，说明是文件夹
            Log.i(TAG, "文件夹以及存在");
        }

        if (!file.mkdirs()) {
            Log.i(TAG, "创建成功");
        }
    }

    public static void CopyAssets(Context context, String oldPath, String newPath) {
        try {
            String fileNames[] = context.getAssets().list(oldPath);// 获取assets目录下的所有文件及目录名
            if (fileNames.length > 0) {// 如果是目录
                File file = new File(newPath);
                file.mkdirs();// 如果文件夹不存在，则递归
                for (String fileName : fileNames) {
                    CopyAssets(context, oldPath + "/" + fileName, newPath + "/" + fileName);
                }
            } else {// 如果是文件
                InputStream is = context.getAssets().open(oldPath);
                FileOutputStream fos = new FileOutputStream(new File(newPath));
                byte[] buffer = new byte[1024];
                int byteCount;
                while ((byteCount = is.read(buffer)) != -1) {// 循环从输入流读取
                    // buffer字节
                    fos.write(buffer, 0, byteCount);// 将读取的输入流写入到输出流
                }
                fos.flush();// 刷新缓冲区
                is.close();
                fos.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static Map<String,String> currentVersionByBundleName (Context reactContext, String module, String type) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/version.json";

        StringBuilder sb = new StringBuilder();
        try {
            File file = new File(path);
            InputStream in = null;
            in = new FileInputStream(file);
            int tempbyte;
            while ((tempbyte = in.read()) != -1) {
                sb.append((char) tempbyte);
            }
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        final Map<String, String> constants = new HashMap<>();

        try {
            JSONObject versionJSON = new  JSONObject(sb.toString());
            String version = versionJSON.getJSONObject(type).getString(module);
            String moduleType = versionJSON.getBoolean("isStaging") ? "staging": "release";
            String key = versionJSON.getString("key");

            // 放回当前的 bundle Version
            constants.put("version",version);
            constants.put("type",moduleType);
            constants.put("key",key);

            return constants;

        }catch (Exception e) {
            Log.i(TAG, "currentVersionByBundleName: ",e);
            return constants;
        }

    };

    static Map<String,String> currentVersionByBundleName (Context reactContext) {
        String path = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/version.json";

        StringBuilder sb = new StringBuilder();
        try {
            File file = new File(path);
            InputStream in = null;
            in = new FileInputStream(file);
            int tempbyte;
            while ((tempbyte = in.read()) != -1) {
                sb.append((char) tempbyte);
            }
            in.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        final Map<String, String> constants = new HashMap<>();

        try {
            JSONObject versionJSON = new  JSONObject(sb.toString());

            String moduleType = versionJSON.getBoolean("isStaging") ? "staging": "release";
            constants.put("moduleType",moduleType);

            return constants;

        }catch (Exception e) {
            Log.i(TAG, "currentVersionByBundleName: ",e);
            return constants;
        }

    };

    static Boolean hasCache (Context context) {
        String path = context.getExternalFilesDir(null).getAbsolutePath();
        File file = new File(path + "/version.json");
        // 如果有值 就不要重复创建了
        if(  file.exists()  ){
            return  true;
        }else{
            return  false;
        }
    }

}
