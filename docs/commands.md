# Node full commands list

## orwell client 0.0.1

### Usage
```
cli-wallet [option] <command>   send command to orwell
cli-wallet help - commands list
```

Available Commands:
### addresses
```
cli-wallet getaddressbalance <address>
cli-wallet getaddressmempool <address>
cli-wallet getaddresstxids <address>
```

### blockchain
```
cli-wallet getbestblockhash
cli-wallet getblock <hash1,...,hashN>
cli-wallet getblockcount
cli-wallet getblockhash <index>
cli-wallet getblockheader <hash1,...,hashN>
cli-wallet getdifficulty
cli-wallet getmempoolinfo
cli-wallet getrawmempool
cli-wallet gettxout <txid> <n>
cli-wallet consensus
cli-wallet gettx <hash>
cli-wallet printtx <hash>
```


### control
```
cli-wallet help
cli-wallet stop
```

### democracy
```
cli-wallet democracy.create <type> [paramsjsonarray]
cli-wallet democracy.info <id>
```

### mining
```
cli-wallet getblocktemplate <jsonobj>
cli-wallet submitblock <json>
```


### network
```
cli-wallet getpeerinfo
cli-wallet getnetworkinfo
cli-wallet addnode <host//port>
cli-wallet addnode <host> [port]
```

### Datascript
```
cli-wallet decodedatascript <hex> [dbname]
cli-wallet encodedatascript <json_array_of_dscommand> [dbname]
cli-wallet senddatascript <fromaddress> <toaddress> <hex>
cli-wallet dbcreate <fromaddress> <toaddress> <dataset> <privileges> [is_private=false]
cli-wallet dbsettings <fromaddress> <toaddress> <dataset> <settings_json>
cli-wallet dbwrite <fromaddress> <toaddress> <dataset> <data_json_array>
cli-wallet syncdb <dbname>
cli-wallet cleardb <dbname>
```

### keystore
```
cli-wallet addpem <path/to/file> <dbname> [datasetname]
cli-wallet rempem <dbname> [datasetname]
cli-wallet getpem <dbname> [datasetname]
```

### wallet
```
cli-wallet dumpprivkey <address>
cli-wallet getaccount <address>
cli-wallet getaccountaddress <account_name>
cli-wallet getaddressesbyaccount <account_name>
cli-wallet getnewaddress <account_name>
cli-wallet getbalance <account_name>
cli-wallet printtx <txid>
cli-wallet sendmany <fromaccount> {'address':amount,...}
cli-wallet sendfrom <fromaccount> <address> <amount> [datascript]
cli-wallet sendtoaddress <address> <amount> [datascript]
```

## unsupported yet commands

### blockchain
```
cli-wallet getblockchaininfo
cli-wallet getspentinfo
cli-wallet gettxoutproof [<txid>,...] ( blockhash )
cli-wallet verifychain [checklevel] [numblocks]
cli-wallet getblockhashes <timestamp>
```

### control
```
cli-wallet debug controlbytes
```

### mining 
```
cli-wallet getmininginfo
```

### network
```
cli-wallet getconnectioncount
cli-wallet ping
```


### rawtransactions
```
cli-wallet createrawtransaction [ [tx, indexoutinthistx, addrin] ] [ [amountinsatoshi, address] ] ( locktime )
cli-wallet createrawtransaction <hex> ( locktime )
cli-wallet sendrawtransaction [ [tx, indexoutinthistx, addrin] ] [ [amountinsatoshi, address] ] ( locktime )
cli-wallet sendrawtransaction <hex>
cli-wallet getrawtransaction <txid>
cli-wallet sendrawtransaction <hex>
cli-wallet decoderawtransaction <hex>
cli-wallet decodescript <hex>
```

### wallet
```
cli-wallet backupwallet <path/to>
cli-wallet dumpwallet <path/to>
cli-wallet importwallet <path/from>
cli-wallet importprivkey <key>
cli-wallet getreceivedbyaccount <account_name> [confirmation=6]
cli-wallet getreceivedbyaddress <address> [confirmation=6]
cli-wallet getunconfirmedbalance
cli-wallet getwalletinfo <account_name>
cli-wallet listaccounts [confirmation=6]
cli-wallet listaddressgroupings
cli-wallet listlockunspent
cli-wallet listreceivedbyaccount [minconf=6]
cli-wallet listreceivedbyaddress [minconf=6]
cli-wallet listtransactions <account_name> [count=500] [fromhash]
cli-wallet move <fromaccount> <toaccount> amount
cli-wallet setaccount <address> <account>
cli-wallet settxfee <amount>
cli-wallet signmessage <address> <message>
```

### util
```
cli-wallet validateaddress <address>
cli-wallet verifymessage <address> <signature> <message>
```
