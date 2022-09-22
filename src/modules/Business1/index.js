import React from "react";
import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import Imgx from "./assets/img/1024_500.png";

// 整个App 的骨架，基础包 更新要严格控制
class Frame extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.hello}>BU1 </Text>
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
