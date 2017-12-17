//var cl = require('../../client');

module.exports = function (argv, client) {


    if (argv._.length == 1) {//from hex


        var hex = argv._[0];

        client.send("sendrawtxfromhex", [hex],
                function (status, res) {
                    if (status)
                        console.log(res);
                    else
                        console.log({code: -1, message: 'cant connect to server'})
                }
        );

    } else if (argv._.length > 1) {//from json inputs

        var a = process.argv.slice(3);
        client.send("sendrawtxfromjson", a,
                function (status, res) {
                    if (status)
                        console.log(res);
                    else
                        console.log({code: -1, message: 'cant connect to server'})
                }
        );




    }

}