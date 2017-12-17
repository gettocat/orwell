module.exports = function () {

    var res = require('../../res');

    setTimeout(function (code) {
        process.exit(code || 0);
    }, 5000);
    
    return res("ok");

}