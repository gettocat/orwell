//work with global value in module language - its bad things :)
var config = require('../config')
global.include = function (file) {
    var path = process.cwd() + '/' + file.replace(".", "/");
    if (config.debug.include)
        console.log('Load file: ' + path)
    return require(path);
}

module.exports = {};

