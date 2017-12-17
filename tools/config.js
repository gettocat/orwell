/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var fs = require('fs');
var config = require('../config');

module.exports = {
    dataset: null,
    cnf: null,
    getLocalHomePath: function () {
        var homepath;
        if (process.platform == 'win32')
            homepath = process.env.APPDATA || process.env.USERPROFILE;
        else
            homepath = process.env.HOME;

        var dir = homepath + "/" + (process.platform == 'linux' ? "." : "") + config.appname;
        module.exports.initDir(dir);

        return dir;
    },
    initDir: function(path){
        var dir = path;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    },
    init: function () {
        var dir = module.exports.getLocalHomePath();
        var cnfFile = module.exports.cnf = dir + "/config.json";
        if (!fs.existsSync(cnfFile)) {
            fs.closeSync(fs.openSync(cnfFile, 'w'));
        }

        var contents = fs.readFileSync(module.exports.cnf, 'utf8');
        if (contents) {
            global.config = JSON.parse(contents);
            if (config.debug.fs)
                console.log('load from file: ' + contents);
        } else {
            global.config = {};
        }
    },
    put: function () {
        if (config.debug.fs)
            console.log('save to file: ' + module.exports.cnf + JSON.stringify(global.config));
        fs.writeFileSync(module.exports.cnf, JSON.stringify(global.config));
    }

}