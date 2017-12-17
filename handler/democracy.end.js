/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

module.exports = function (opts, self) {

    if (self) {
        return false;
    }

    if (opts.type == 'script.time' && opts.status == 'reached') {

        var netTime = require('../blockchain/block/nettime');
        netTime.setTime(opts.result);

    }

    return {};
}