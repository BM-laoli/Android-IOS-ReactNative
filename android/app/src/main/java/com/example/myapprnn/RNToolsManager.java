package com.example.myapprnn;

import android.app.Activity;
import android.content.Intent;


import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

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
}
