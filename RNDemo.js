import React from "react";
import { StyleSheet, Text, View, AppRegistry } from "react-native";

// 整个App 的骨架，基础包 更新要严格控制
class BU1 extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.hello}>BU1 </Text>
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

AppRegistry.registerComponent("Bu1Activity", () => BU1);
