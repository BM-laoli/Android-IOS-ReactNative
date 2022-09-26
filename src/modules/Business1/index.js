import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Button,
} from "react-native";
import Imgx from "./assets/img/1024_500.png";
import { navigation } from "../../../common/utils";
// 整个App 的骨架，基础包 更新要严格控制
const Frame = (props) => {
  useEffect(() => {
    init();
    console.log("初始化");
    return () => {
      console.log("销毁");
    };
  }, []);

  const init = async () => {
    const params = await navigation.getFromActivity();
    console.log("params", params);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hello}>BU1 </Text>
      <Button
        title="前往BU2"
        onPress={() => {
          navigation.pushToActivity("Bu2Activity", { value: 111 });
        }}
        style={styles.btn}
      />

      <ScrollView style={styles.flatContainer}>
        <View style={styles.imgView}>
          <Image
            resizeMethod="resize"
            resizeMode="contain"
            source={Imgx}
            // source={imgICON}
            style={styles.img}
          />
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
  btn: {
    width: 30,
    height: 30,
  },
});

export default Frame;
