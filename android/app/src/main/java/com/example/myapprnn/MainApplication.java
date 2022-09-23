package com.example.myapprnn;

import android.app.Application;

import com.facebook.soloader.SoLoader;

public class MainApplication extends Application   {
    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
    }

    // 载入一个基础 base 包存入内存 其它 View 加载的时候 直接merge ，构成一个 bundle
}
