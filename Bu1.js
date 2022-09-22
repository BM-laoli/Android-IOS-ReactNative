import React from "react";
import { AppRegistry } from "react-native";
import BU1 from "./src/modules/Business1";
import { bu1 } from "./app.json";
// 整个App 的骨架，基础包 更新要严格控制

AppRegistry.registerComponent(bu1.name, () => BU1);
