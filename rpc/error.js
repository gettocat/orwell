

var error = function (code, message) {
    console.log(JSON.stringify({code: code, error: message}))
}

error.INVALID_PARAMS = -1;


module.exports = error;