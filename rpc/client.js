var http = require('http');
var stdout = require('./stdout')

var Client = function (opts) {
    if (!opts)
        opts = {};

    var options = {
        host: opts.host || 'localhost',
        path: opts.path || '/',
        port: opts.port || '49999',
        method: opts.method || 'POST',
        timeout: 10000
    };

    this.send = function (method, params, callback) {
        var data = {
            'method': method,
            'params': params,
        }

        if (!callback)
            callback = stdout;

        var cb = function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                callback(1, JSON.parse(str));
            });

            response.on('error', function (err) {
                callback(0, err);
            });
        }

        var req = http.request(options, cb);
        req.on("error", function (err) {
            callback(0, err);
        })

        req.write(JSON.stringify(data));
        req.end();

    }

}

module.exports = Client

