import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator
} from "react-native";
import Imgx from "./assets/img/test.png";
import TestNativeInfo from "./TestNativeInfo";
import { navigation } from "../../../common/utils";
import useServerHot from '../../../common/hooks/useServerHot'
import versionInfo from "../../../config/versionMap.json";
// 整个App 的骨架，基础包 更新要严格控制
const Frame = () => {
  const { CodePush, loading } =  useServerHot({
    host: "http://192.168.101.6:8085",
    versionInfo: versionInfo,
  })

  useEffect(()=>{
    CodePush()
  },[])

  return (
    <View style={styles.container}>
      { loading ?  <ActivityIndicator size="large" color="#0000ff"></ActivityIndicator>
      : <>
            <Text style={styles.hello}>111 1.0.0 内容 </Text>
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
      </>  
    }
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
  btn: {
    width: 30,
    height: 30,
  },
});

export default Frame;
