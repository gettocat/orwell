
var error = function (code, message) {
    return ([({code: code, error: message}), null])
}

error.INVALID_PARAMS = -1;
error.INVALID_RESULT = -2;


module.exports = error;