import React from "react";
import { AppRegistry, StyleSheet, Text, View } from "react-native";

class HelloWorld extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.hello}>Hello, World</Text>
        <Text style={styles.hello}>应用的设置非常好</Text>
        <Text style={styles.hello}>这是我的第一个非常不错的项目</Text>
        <Text style={styles.hello}>Android + RN</Text>
      </View>
    );
  }
}
var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  hello: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
});

AppRegistry.registerComponent("MyReactNativeApp", () => HelloWorld);
