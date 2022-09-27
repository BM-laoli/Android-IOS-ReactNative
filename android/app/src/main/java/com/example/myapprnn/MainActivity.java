package com.example.myapprnn;


import android.content.res.AssetManager;
import android.util.Log;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;

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
    public String getResName() {
        return "MyReactNativeApp";
    };

    @Override
    public void preInit() {
        // 获取访问权限
        try {
            InputStream is = getResources().getAssets().open("read.txt");
            Reader in = new InputStreamReader(is);
            BufferedReader bufferedReader = new BufferedReader(in);
            String line = null;
            while (null != (line = bufferedReader.readLine()) ){
                System.out.println("assets file==========" + line);
            }

            bufferedReader.close();
            in.close();
            is.close();
            // 写文件

            boolean isCopy = true;
            AssetManager mAssetManger = getResources().getAssets();

            Log.i("TAG", "preInit: "+getFilesDir().getAbsolutePath());
        }catch (Exception e){
            Log.e("err",e.getMessage() );
        }

    }

}