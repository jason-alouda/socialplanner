"use strict";

const chokidar = require("chokidar");
const socketIo = require("socket.io");

module.exports = (server, publicPath) => {
  const io = socketIo(server);

  chokidar.watch(publicPath, {
    cwd: publicPath, ignoreInitial: true
  }).on("all", (type, path) => {
    if (type.endsWith("Dir")) return;
    if (path.endsWith(".css")) {
      io.emit("cssChange", path);
    } else {
      io.emit("reload");
    }
  });
};
