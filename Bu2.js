import React from "react";
import { AppRegistry } from "react-native";
import BU2 from "./src/modules/Business2";
import { bu2 } from "./app.json";
// 整个App 的骨架，基础包 更新要严格控制

AppRegistry.registerComponent(bu2.name, () => BU2);
