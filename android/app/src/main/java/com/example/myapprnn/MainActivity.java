package com.example.myapprnn;

public class MainActivity extends PreBaseInit {

    @Override
    public String getJSBundleAssetName(){
        return "index.android.bundle";
    };

    @Override
    public String getJsModulePathPath(){
        return "index";
    };

    @Override
    public String getResName(){
        return "MyReactNativeApp";
    };
}