import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  NativeModules,
} from "react-native";
import Imgx from "./assets/img/test.png";
import TestNativeInfo from "./TestNativeInfo";
import { navigation } from '../../../common/utils';

// 整个App 的骨架，基础包 更新要严格控制
class Frame extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.hello}>Hello, World</Text>
        <Text style={styles.hello}>应用的设置非常好</Text>
        <Text style={styles.hello}>这是我的第一个非常不错的项目</Text>
        <Text style={styles.hello}>Android + RN</Text>
        <Text
          style={styles.hello}
          onPress={() => {
            
            navigation.pushToActivity("Bu1Activity" ,{
              value :"1111"
            });

          }}
        >
          {" "}
          去BU2{" "}
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
  }
}

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