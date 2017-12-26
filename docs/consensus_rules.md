# Consenses rules

Validation of blocks and transactions is the main core of any blockage and the most difficult part in its implementation.

Validation of transactions is a process of checking the transaction for compliance with the criteria of the current network. A list of the main Orwell network criteria for transactions:

| Name | Description 
|------|------------
| Version | allowable values
| tx.inputs > 0 |  Tx must have 1 or more inputs
| tx.outputs > 0 | Tx must have 1 or more outputs
| tx.input.der && input.pubkey | Non-coinbase transactions must have a signature and public key in scriptSig
| tx.size is ok | The transaction size is more than 70 bytes or less than the block size
| tx.output.amount | Each transaction output must be greater than zero (or contain datascript.Orwell allows you to send zero transactions, but only in the case of datascript transactions), and the output should not be more than supply (20e6)
| in.amount>=out.amount | At the input, the transaction must have more coins than the output (or an equal number)
| Signed correctly | The signature of the transaction must correspond and when verifying the signature with the public key of the sender must return a positive result
| Every input: is standart  | For each input, it is checked that the scriptPubKey of the standard form: Pay To Script Hash (P2SH) or Multisig (TODO)
| Every input: canSpend | For each entry, it is checked that the input coins can be spent by the sender.
| Every input: notSpended | It checks for each input the presence of unspent tx in utxo, or binds utxo.spentHash to the current transaction.
| Every input: isNotOrphan | If the previous transaction, from the input still in mempool - the current transaction will not be able to pass until the previous one is fixed in the blockchain.
| Check fee | Verify that the difference between the entry and exit of the transaction is greater than the minimum commission


Next rules only for transaction with datascript content:


| Name  | Description
|- |-
| Is valid datascript | After deserializing the data script, the number of elements must be equal to the number specified in the `datascript_array count items` filed
| dbisexist | The first operation, contained in the datascript index must be `create`. (If there are no elements in the index - then in the current datascript the first must be `create`)
| settingsCanChangeOnlyOwner | check that the sender is the owner of the database, if the operator is `settings`.
| createOnlyOnce |  operation `create` for a unique dataset can exist only once
| canWrite | It checks the `writeScript` with the current sender. If rule `5560` is specified, the list of privileges for the public key of the sender is checked in it, and only if it is found there (or in the `owner_key`) - this rule is true. If `writeScript = ALL` or empty - then this rule is always true.
| canEdit | Only owner can edit the record, users from the privilege list, or the user whose public key was used to create the record.
| Fee |  Each operation with datascript is paid by fee: `create`: 0.01 (1 million satoshi) `write`: 0.000000100 (10 satoshi) `settings`: 0.000001000 (100 satoshi)


Next rules only for transaction with local domain content:

| Name  | Description
|- |-
| Entry is valid | The entry must contain the address field and the domain
| isValidAddress | The address must be in the orwell format (bitcoin format).
| isValidDomain | The domain must match the format: Only Latin characters and the symbol `.` (Dot) are allowed. The length can be from 3 to 255 characters inclusive. The first and last character can not be a dot, just you can not use several points in a row in the domain (like `...`).
| CheckDomainHistory | If the given domain already exists in the database - check that the current public key of the sender is the public key of the domain owner (the owner is the first one). The domain must be unique throughout the network. |
