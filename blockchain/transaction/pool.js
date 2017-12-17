/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var txValidator = require('./validator')

var pool = function (arr) {
    for (var i in arr)
        this.append(arr[i]);
}

pool.prototype = {
    list: [],
    append: function (tx) {

        if (this.check(tx) === 1) {
            this.list.push(tx);
        }

    },
    check: function (tx) {

        var txval = new txValidator(tx);
        if (txval.isValid())
            return 1;
        
        
        return txval.getDebug();
        
    },
    sort: function() {
        //TODO txpool/sort my fee desc
        //fee(tx) = input(tx) - output(tx)
    }

}

module.exports = pool;