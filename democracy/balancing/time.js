/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

module.exports = function (info) {

    var sum = 0;
    for (var i in info.answers) {
        sum += info.answers[i];
    }

    return sum / info.answers.length;
}