/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

module.exports = function (info) {

    var arr = [];
    for (var i in info.answers) {
        if (!arr[JSON.stringify(info.answers[i])])
            arr[JSON.stringify(info.answers[i])] = 1;
        else
            arr[JSON.stringify(info.answers[i])]++;
    }

    var max = -1, maxKey = -1;
    for (var i in arr) {
        if (arr[i] > max) {
            max = arr[i];
            maxKey = i;
        }
    }

    if (maxKey != -1)
        return JSON.parse(maxKey);
    return null;
}