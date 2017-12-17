/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var config = require('../../config')
var util = require('../../tools/util')
var networkTime = require('../../democracy/networktime')
var fnc = function () {

}

fnc.lastAsk = 0;
fnc.last = new Date().getTime();

fnc.setTime = function (time) {

    fnc.last = time;
    fnc.lastAsk = new Date().getTime() / 1000 + util.rand(-120, 120);

}

fnc.askTime = function () {
    if (fnc.isValid())
        networkTime(function (netTime) {
            if (config.debug.nettime)
                console.log("average network time: ", netTime.toString());
            fnc.last = netTime;
        })
}

fnc.getLast = function () {
    return fnc.last;
}

fnc.isValid = function() {
    return (new Date().getTime() / 1000 - fnc.lastAsk) <= 900
}


module.exports = fnc