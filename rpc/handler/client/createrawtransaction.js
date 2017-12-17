module.exports = function (argv, client) {


    if (argv._.length == 1) {//from hex

        var hex = argv._[0];
        client.send("createrawtxfromhex", [hex]);



    } else if (argv._.length > 1) {//from json inputs

        var a = process.argv.slice(3);
        client.send("createrawtxfromjson", a);

    }

}