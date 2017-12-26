[Back to intro](https://github.com/gettocat/orwell/blob/master/docs/intro.md)

# Blockchain

All information in the orwell platform is currently stored in the nosql database of lokijs (in the future there will be a move to more serious and prepared platforms). All information is divided into 3 types - entry, index, memory. Entry - means the storage of the document (at the moment it is the main type for storing blocks at a specific node); index - stores the indices of all the blocks for the required parameters. Time, height, addresses, utxo by addresses and etc. The memory type allows storing information in memory without storing it on the hard disk. For example, information about connected nodes, or the memory pool of unconfirmed transactions is stored in the memory type.

Each time the node starts, the indexing process takes place, and if the indexes for the top block are available, the indexing process stops, because the indexes are up-to-date. With each addition of a block from the network - this block is indexed and indexes are updated. For a memory pool, there are also indexes that are deleted when the transaction enters a block and is confirmed.

Datascript is also indexed. The information for each address (database) is stored in the format:

`Address: [array of transaction hashes, in which there was a datascript operation with this database]`

Datascript is not decrypted and stored as a byte-sequence to save resources, but also based on the fact that it can be encrypted.
