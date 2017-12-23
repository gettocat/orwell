# datascript

Datascript is the protocol of interaction between an ordinary centralized database and decentralized blockchain. In its essence, this is a set of structured commands to a database written in a certain way into a byte sequence (to save space). Datascript is built in after the lock_time parameter in the transaction, the transaction signature is performed along with the datascript.

Datascript example from tx [679afe93a52ad98c3b015eddf4cfaf0a3280945f4dfa9ce8284015f1db3a4e8c](http://orwellscan.org/tx/679afe93a52ad98c3b015eddf4cfaf0a3280945f4dfa9ce8284015f1db3a4e8c?out=0):

Hex encoded (packed): 
```hex
ef01fd4f01190b6578616d706c6564617461fd3f0154fd3b011f000f0fa1067e45f40003f1096f776e65725f6b65798230343233633635653064373364626161386537393435633965663135626338366533643864396638636364323636626366323362623032646336333432386636623239343766336164643731636536333962653739646561333933313237613061336661623136613339306630326537363966633135373561333535333130323461f30a70726976696c6567657301f1008230346231363165656566623739363163366637306137643338666434373764616633333437643231346561663365313639643964316434336232346437323338383665343063643962633563633232393638333635656531663962653635333932303539383630643735656432356136303836653830666462653138336565613364f20b7772697465536372697074fdb815
```

And json view (unpacked):

```json
{
   "dataset": "exampledata",
   "operator": "create",
   "content": {
    "owner_key": "0423c65e0d73dbaa8e7945c9ef15bc86e3d8d9f8ccd266bcf23bb02dc63428f6b2947f3add71ce639be79dea393127a0a3fab16a390f02e769fc1575a35531024a",
    "privileges": [
"04b161eeefb7961c6f70a7d38fd477daf3347d214eaf3e169d9d1d43b24d723886e40cd9bc5cc22968365ee1f9be65392059860d75ed25a6086e80fdbe183eea3d"
    ],
    "writeScript": 5560
   },
   "canRead": true,
   "success": true
  }

```


In datascript, the data to be entered into the database, as well as the type of operation (which I will describe below), and what table (dataset) it is necessary to record. Datascript consists of 4 levels:

## 1. transport level
At this level, we must consider the first byte of our byte sequence. If it is 0xef - then we have a vector of operations and read them in a special way. In any other case, one script is presented.


### 1.1 vector
| Flag | Items | Datascript[] |
|- 	|- |- |
| uint8 / 0xef |  var_int | var_str[] |

### 1.2 item
| Flag | Datascript |
|- |-|
| uint8 / 0xee | Datascript content |

## 2. datascript item level

At this level, the following data is recorded: the operator (command to the database), dataset where to write the data, as well as the script itself.

| Operator | Dataset | readScript |
|- |-|- |
| uint8 | var_str | var_str |

Currently available data operators:


| Hex | Name | Description |
|- |-|- |
| `0x19` | create | creation of dataset. **Must be** first datascript in dataset stack! |
| `0x20` | write | Insert/Update data in dataset. Field oid is required. Type of action (insert/update) depends on field oid. |
| `0x21` | settings | Update settings of database |


## 3. readScript level


The orwell concept assumes that each transaction containing datascript content has readScript and writeScript.
writeScript is located in the database settings and at each new transaction checks who can write to this dataset.

Currently available options are writeScript:

| Hex | Name | Description |
|- |-|- |
| `0x55 0x60` | `PUSHDATA_DBWRITEPUBLICKEY OP_CHECKDBPRIVILEGES` | Write the current public key of person who tries to write to the database is stack, compare it to the privileges and owner_key list in the database settings. Only those who have privileges for this (or the database owner) can record |
|  | `ALL` | Any user can write to this dataset |


readScript literally describes "who can read the message". Readscript is achieved by encrypting the resulting jsonhex message.

Read script is not Turing-complete, stack oriented language, similar to what is used in scriptSig and scriptPubKey in Bitcoin. Operators are divided into 3 groups:

* OP_ at the beginning of the description means actions with the stack. For example OP_EQUAL - take 2 elements from the top of the stack and check them for equality. 
* Operators starting with DATA_ mean that the next byte in the bytecode is a specific record, whether it's a hash, a number or a string, they will be interpreted correctly. 
* The last group - PUSHDATA_ means input operators, which require inserting certain data into the stack of this bit.


List of readScript operators

| Hex | Name | Description|
|-----|------|------------|
| `0x52` | `DATA_ENCRYPTIONALGORITHM` | Define hexjson encryption algorithm |
| `0x53` | `DATA_HEXJSONENCRYPTED` | Define encrypted hexjson var_str next |
| `0x54` | `DATA_HEXJSON` | Define open hexjson var_str next |
| `0x58` | `DATA_HASH` | Define next sha256double hash (32 byte) |
| `0x55` | `PUSHDATA_DBWRITEPUBLICKEY` | need push into stack public key of writer |
| `0x56` | `PUSHDATA_DBREADPRIVATEKEY` | need push into stack private key for encryption: params (dbname, datasetname, encryption_type) |
| `0x57` | `OP_DECRYPT` | Operation decryption |
| `0x87` | `OP_EQUAL` | Operation equal |
| `0x59` | `OP_HASH256` | Operation hashing sha256 |
| `0x60` | `OP_CHECKDBPRIVILEGES` | Check for the existence of a string in the privileges array in dataset preferences |


At this level, we get a stack-oriented program and produce its interpretation to a level where our stack is not empty or there will not be one Boolean value left. In the end, we get either the contents of datascript or empty data, which means that either the information is corrupted, or we do not have the opportunity to read it (there is no necessary key to decrypt the message).

At this level, there are currently two options for readScript:

* Open

Look like:
```
DATA_HEXJSON + <jsonhexbytes>
```

```
0x54 + <jsonhexbytes>
```


* Encrypted

```
DATA_HEXJSONENCRYPTED + var_str(encrypted data) + PUSHDATA_DBREADPRIVATEKEY + uint8(encryption) + OP_DECRYPT + OP_HASH256 + DATA_HASH + char[32](hash) + OP_EQUAL
```

```
0x53 + var_str + 0x56 + (0x1 or 0x2) + 0x57 + 0x59 + 0x58 + char[32] + 0x87
```

What literally can be translated as:
Encrypted data `A`
Add a private key from this database from keystore to the beginning of stack `B`
The encryption algorithm is` 0x1 (RSA)` or `0x2 (ECDH) C`
Decrypt with the following parameters from the beginning of the stack: `DECRYPT (A, B, C)`
The decryption result is put at the beginning of the stack `R`
Hashing the result of `HR`
The hash data from the sender `Q`
Compare ` HR` and `Q`
`RESULT` result
If `RESULT = true`, the result is decrypted and we can read data from datascript.


| Stack | Operation | Result | Variables |
|-------|-----------|--------|-----------|
| `0x53, var_str, 0x56, uint8, 0x57, 0x59, 0x58, char[32], 0x87` |  `DATA_HEXJSONENCRYPTED` |  `A`  | `A`
| `A, 0x56, uint8, 0x57, 0x59, 0x58, char[32], 0x87` | `PUSHDATA_DBREADPRIVATEKEY`  | `B,C`   | `A,B,C`
| `A, B, C, OP_DECRYPT, OP_HASH256, DATA_HASH, char[32](hash), OP_EQUAL` |  `OP_DECRYPT` |  `R`  | `R`
| `R, OP_HASH256, DATA_HASH, char[32](hash), OP_EQUAL` |  `OP_HASH256` | `HR`   | `R, HR`
| `DATA_HASH, char[32](hash), OP_EQUAL` | `DATA_HASH`  |  `Q`  | `Q, HR, R`
| `HR, Q, OP_EQUAL` |  `OP_EQUAL` |   `RESULT` | `R, RESULT`
| `TRUE` |  `_|_` |    | `R`


## 4. JSONHEX level

The result of the readScript interpretation is the jsonhex sequence of bytes, which now needs to be translated to the object (see: [jsonhex section](https://github.com/gettocat/orwell/blob/master/docs/jsonhex.md)) and send to execution in database.

