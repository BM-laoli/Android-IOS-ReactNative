import React, { useEffect } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image
} from 'react-native';
import TestNativeInfo from  './src/modules/Main/TestNativeInfo'
import Imgx from "./src/modules/Business1/assets/img/1024_500.png";
import NativeModule from './common/native';
const { changeActivity } = NativeModule;

class RNHighScores extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text  onPress={()=>{
          changeActivity("IOS")
        }} style={styles.highScoresTitle}>
          IOS bundle2
        </Text>
        <Image
            resizeMethod="resize"
            resizeMode="contain"
            source={Imgx}
            // source={imgICON}
            style={styles.img}
          />

        <View>
          {/* <TestNativeInfo></TestNativeInfo> */}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  highScoresTitle: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  scores: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  },
  img: {
    width: "100%",
    height: 600,
  },
});

AppRegistry.registerComponent('IOS2', () => RNHighScores);