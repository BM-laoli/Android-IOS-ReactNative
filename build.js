const fs = require("fs");

const clean = function (file) {
  fs.writeFileSync(file, JSON.stringify({}));
};

const hasBuildInfo = function (file, path) {
  const cacheFile = require(file);
  return Boolean(cacheFile[path]);
};

const writeBuildInfo = function (file, path, id) {
  const cacheFile = require(file);
  cacheFile[path] = id;
  fs.writeFileSync(file, JSON.stringify(cacheFile));
};

const getCacheFile = function (file, path) {
  const cacheFile = require(file);
  return cacheFile[path] || 0;
};

const isPwdFile = (path) => {
  const cwd = __dirname.split("/").splice(-1, 1).toString();

  const pathArray = path.split("/");
  const map = new Map();
  const reverseMap = new Map();

  pathArray.forEach((it, indx) => {
    map.set(it, indx);
    reverseMap.set(indx, it);
  });

  if (pathArray.length - 2 == map.get(cwd)) {
    return reverseMap.get(pathArray.length - 1).replace(/\.js/, "");
  }

  return "";
};

module.exports = {
  hasBuildInfo,
  writeBuildInfo,
  getCacheFile,
  clean,
  isPwdFile,
};
