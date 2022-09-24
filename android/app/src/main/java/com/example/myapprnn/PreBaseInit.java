package com.example.myapprnn;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.KeyEvent;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.CatalystInstanceImpl;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.soloader.SoLoader;

public class PreBaseInit extends AppCompatActivity implements DefaultHardwareBackBtnHandler {
    private final int OVERLAY_PERMISSION_REQ_CODE = 1;
    private ReactRootView mReactRootView;
    private ReactInstanceManager mReactInstanceManager;

    public String getJSBundleAssetName(){
      return "index.android.bundle";
    };

    public String getJsModulePathPath(){
        return "index";
    };

    public String getResName(){
        return "MyReactNativeApp";
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
            }
        }
        SoLoader.init(this, false);

        // root 容器
        mReactRootView = new ReactRootView(this);

//        if( BuildConfig.DEBUG ){
//            mReactInstanceManager = ReactInstanceManager.builder()
//                    .setApplication(getApplication())
//                    .setCurrentActivity(this)
//                    .setBundleAssetName(getJSBundleAssetName())
//                    .setJSMainModulePath(getJsModulePathPath())
//                    .addPackages(MainApplication.getInstance().packages)
//                    .setUseDeveloperSupport(true)
//                    .setInitialLifecycleState(LifecycleState.RESUMED)
//                    .build();
//
//            mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
//            setContentView(mReactRootView);
//            return;
//        }


        mReactInstanceManager = MainApplication.getInstance().builder.setCurrentActivity(this).build();

        if (!mReactInstanceManager.hasStartedCreatingInitialContext()) {
            mReactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
                @Override
                public void onReactContextInitialized(ReactContext context) {
                    //加载业务包
                    ReactContext mContext = mReactInstanceManager.getCurrentReactContext();
                    CatalystInstance instance = mContext.getCatalystInstance();
                    ((CatalystInstanceImpl)instance).loadScriptFromAssets(context.getAssets(), "assets://" + getJSBundleAssetName(),false);

                    mReactRootView.startReactApplication(mReactInstanceManager, getResName(), null);
                    setContentView(mReactRootView);

                    mReactInstanceManager.removeReactInstanceEventListener(this);
                }
            });
            mReactInstanceManager.createReactContextInBackground();
        }

        return;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OVERLAY_PERMISSION_REQ_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    // SYSTEM_ALERT_WINDOW permission not granted
                }
            }
        }
        mReactInstanceManager.onActivityResult( this, requestCode, resultCode, data );
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostPause(this);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(this, this);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostDestroy(this);
        }
        if (mReactRootView != null) {
            mReactRootView.unmountReactApplication();
        }
    }


    @Override
    public void onBackPressed() {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onBackPressed();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager != null) {
            mReactInstanceManager.showDevOptionsDialog();
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

}
