package com.example.myapprnn;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.util.Log;


import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.Reader;

public class RNToolsManager extends ReactContextBaseJavaModule {
    public static final String EXTRA_MESSAGE = "MESSAGE";
    public static final String TAG = "INFO__JONEY";

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

    // 尝试写文件 完成✅
    @ReactMethod
    public void writeFileFoRC () {

        String path = reactContext.getExternalFilesDir(null).getAbsolutePath();
        Log.i(TAG, "writeFileFoRC: " + path);

        // 读区 此app 目录下是否有 bundle 文件夹 没有就创建且 把bu bundle 都丢进去
        // 目录结构是 file-> bundle -> release/releaseStaging
        // 新建文件夹 /Bundle/staging 和/Bundle/release
        createDir(path + "/Bundle/staging/");
        CopyAssets(reactContext,"index.android.bundle", path + "/Bundle/staging/index.android.bundle");
        CopyAssets(reactContext,"bu2.android.bundle", path + "/Bundle/staging/bu2.android.bundle");
        CopyAssets(reactContext,"bu1.android.bundle", path + "/Bundle/staging/bu1.android.bundle");

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

    public void createDir(String filePath) {
        File file = new File(filePath);

        if (file.exists()) {
            Log.i(TAG, "文件夹以及存在");
        }
        if (filePath.endsWith(File.separator)) {// 以 路径分隔符 结束，说明是文件夹
            Log.i(TAG, "文件夹以及存在");
        }

        //判断父目录是否存在
        if (!file.getParentFile().exists()) {
            //父目录不存在 创建父目录
            if (!file.mkdirs()) {
                Log.i(TAG, "创建成功");
            }
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

}
