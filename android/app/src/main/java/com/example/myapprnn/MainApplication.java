package com.example.myapprnn;

import android.app.Application;

import com.facebook.react.PackageList;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.common.LifecycleState;
import com.facebook.soloader.SoLoader;

import java.util.List;

public class MainApplication extends Application   {
    public ReactInstanceManagerBuilder builder;
    public  List<ReactPackage> packages;
    private static MainApplication mApp;

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        mApp = this;


        packages = new PackageList(this).getPackages();
        packages.add(new RNToolPackage());

        builder = ReactInstanceManager.builder()
                .setApplication(this)
                .addPackages(packages)
                .setJSBundleFile("assets://common.android.bundle")
                .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);
    }

    public static MainApplication getInstance(){
        return mApp;
    }


}
