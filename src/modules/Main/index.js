import React, { useState } from "react";
import { StyleSheet, Text, View, Image, ScrollView, Alert } from "react-native";
import Imgx from "./assets/img/test.png";
import TestNativeInfo from "./TestNativeInfo";
import { navigation } from "../../../common/utils";
import NativeModule from "../../../common/native";

import versionInfo from "../../../config/versionMap.json";
// 整个App 的骨架，基础包 更新要严格控制
const Frame = () => {
  const [data, setData] = useState([]);
  const getData = async (version, module, key) => {
    const value = await fetch(
      `http://192.168.7.211:8085/api/version_info?oldVersion=${version}&pageModule=${module}&type=Staging&appKey=${key}`
    );

    const data = await value.json();

    return data;
  };
  const CodePush = async () => {
    // 直接全部一次性 把需要更新的bundle 都更新了

    // 是否dev 包
    // if (NativeModule.getAndroidDEV) {
    //   return;
    // }

    // 是否完成文件夹的创建
    if (!NativeModule.isInited()) {
      // cv 文件夹
      NativeModule.writeFileFoRC();
    }

    const promiseAllVersionInfo = [];
    Object.keys(versionInfo.staging).forEach((it) => {
      promiseAllVersionInfo.push(
        NativeModule.getCurrentVersion(
          it,
          versionInfo.isStaging ? "staging" : "release"
        )
      );
    });

    const promiseAllIsLoadUpdate = [];

    Promise.all(promiseAllVersionInfo).then((res) => {
      console.log(res);
      res.forEach((it) => {
        promiseAllIsLoadUpdate.push(getData("it.version", it.module, it.key));
      });

      Promise.all(promiseAllIsLoadUpdate).then((res) => {
        // 看看返回的数据 如果需要更新 就更新 并且重新写入新的数据

        console.log(res);
        setData(res);
        // 只有有一个人 isNeedRefresh = true 请弹窗 提示更新
        if (res.some((it) => it.data.isNeedRefresh)) {
          Alert.alert("有版本更新", "", [
            {
              text: "更新",
              onPress: async () => {
                const str = "v1.0.0-Staging-bu1.android.bundle.zip"
                  .split("-")[2]
                  .split(".");
                str.pop();

                // 先试一下一个的 正常
                NativeModule.downloadFiles(
                  "http://192.168.7.211:8085/files/v1.0.0-Staging-bu1.android.bundle.zip",
                  "staging",
                  str.join(".")
                );
                // 写回版本信息
                //  NativeModule.setFileVersion("index.android.bundle", "staging", "3.0.0");
              },
            },
          ]);
        }
      });
    });
  };

  const updateVersion = async () => {};

  return (
    <View style={styles.container}>
      <Text style={styles.hello}>Hello, World</Text>
      <Text style={styles.hello}>应用的设置非常好</Text>
      <Text style={styles.hello}>这是我的第一个非常不错的项目</Text>
      <Text style={styles.hello}>Android + RN</Text>

      <Text
        style={styles.hello}
        onPress={() => {
          navigation.pushToActivity("Bu1Activity", {
            value: "1111",
          });
        }}
      >
        去BU2
      </Text>

      <Text
        style={styles.hello}
        onPress={() => {
          NativeModule.writeFileFoRC(JSON.stringify(versionInfo));
        }}
      >
        写入文件
      </Text>

      <Text
        style={styles.hello}
        onPress={() => {
          NativeModule.cleanFileByPath();
        }}
      >
        删除BU2 for fileSystem
      </Text>

      <Text
        style={styles.hello}
        onPress={() => {
          NativeModule.downloadFiles();
        }}
      >
        获取文件 和下载
      </Text>

      <Text
        style={styles.hello}
        onPress={() => {
          NativeModule.touchZip();
        }}
      >
        解压缩
      </Text>

      <Text style={styles.hello} onPress={CodePush}>
        获取当前Version 信息
      </Text>

      <ScrollView style={styles.flatContainer}>
        <View style={styles.imgView}>
          <Image
            resizeMethod="resize"
            resizeMode="contain"
            source={Imgx}
            style={styles.img}
          />
          <TestNativeInfo></TestNativeInfo>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    height: 100,
  },
  hello: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  imgView: {
    width: "100%",
  },
  img: {
    width: "100%",
    height: 600,
  },
  flatContainer: {
    flex: 1,
  },
});

export default Frame;
