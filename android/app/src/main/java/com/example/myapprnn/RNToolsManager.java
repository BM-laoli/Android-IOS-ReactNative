package com.example.myapprnn;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;


import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.Reader;

public class RNToolsManager extends ReactContextBaseJavaModule {
    public static final String EXTRA_MESSAGE = "MESSAGE";

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

    // 尝试写文件
    @ReactMethod
    public void writeFileFoRC () {
        try {
            // 不要尝试写assets ，第一次在assets 中，如果有更新后续的包 从 内部存储中加载 和更新
            this.writeStringToFile("2222","/assets/read.txt");

        }catch (IOException e){
            Log.e("EEEE", "writeFileFoRC: ", e);
        }

    }

    public static void writeStringToFile(String content, String filePath) throws IOException {
        PrintWriter out = null;
        try {
            out = new PrintWriter(filePath);
            out.print(content);
        } finally {
            if (out != null) out.close();
        }
    }

}
