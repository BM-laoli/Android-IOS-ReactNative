import React from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import NativeModule from './common/native';
const { changeActivity } = NativeModule;

class RNHighScores extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text onPress={()=>{
              changeActivity("IOS2")
        }}  style ={styles.highScoresTitle}>
            返回IOS2
        </Text>
        <View>
          <Button  title="IOS" ></Button>
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
  }
});

// Module name
AppRegistry.registerComponent('IOS', () => RNHighScores);