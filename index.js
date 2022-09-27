import React from "react";
import { AppRegistry } from "react-native";
import Main from "./src/modules/Main";
import { main } from "./app.json";
// 整个App 的骨架，基础包 更新要严格控制

AppRegistry.registerComponent(main.name, () => Main);
