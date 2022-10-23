const fs = require("fs");
const cacheFile = require("./cacheFile.json");

const hasBuildInfo = function (path) {
  return Boolean(cacheFile[path]);
};

const writeBuildInfo = function (path, id) {
  cacheFile[path] = id;
  fs.writeFileSync("./cacheFile.json", JSON.stringify(cacheFile));
};

const getCacheFile = function (path) {
  return cacheFile[path] || 0;
};

module.exports = {
  hasBuildInfo,
  writeBuildInfo,
  getCacheFile,
};
