# Democracy

The democracy module determines the average opinion of the majority, at the moment it is used to determine the average time of the network (due to differences in time zones for different nodes), as well as to obtain an average consensus status in the network.


The algorithm of this module is quite simple and consists of three stages:

### stage 1 

The node that created the vote (the initiating node) creates a unique voting id-hash in order to take into account the responses of the other network members, as well as specify the necessary parameters. The main parameter is type, which determines the question, in the case of an arbitrary query, or a script that needs to be executed on each node. If type starts with script. - The node needs to find the script in the script folder and execute it. For example, for `type = script.time`, the contents of the script are as follows: 
```js 
return new Date (). getTime () / 1000
```
Those. just giving time in Unixtimestamp format.
So, the node creating a new vote creates a unique id, and adding type and parameters to it gets a string from this byte and signs it with its private key, thereby confirming that the vote was created by this node. Further, from DER, the signature and the public key form scriptSig, as in any transaction input. In addition, the creator also specifies the voting threshold (how many percent is needed for completion, by default this is 50%), as well as the vote timeout (the default is 2 minutes).
All these parameters are sent to all connected nodes in the message `democracy.new`.

### stage 2

When any node (including initiating one) receives a message `democracy.new`, it should (but does not have to) perform several steps:
Find the script type, execute it with parameters, give the result and concatenate it as follows: `id + type + result_job` get a string from this byte, and sign it with your private key. From the signature DER and the public key, generate your scriptSig and send it with the message `democracy.answer` along with the result of the script, thereby confirming its authorship.

### stage 3

The initiating node considers the results of the work after each message `democracy.answer` and if the percentage of answers exceeds the predetermined voting for this (compared with the list of active connections) - begins the process of balancing the result.
The balancing process is averaging all the results. But since the results can be both hashes, strings, arrays, and digits, you must first define a balancing algorithm for each script. For `script.time`, balancing is simply a calculation of the mean. Balancing scripts lie in the folder `democracy/balancing` and must be defined for each script.
After balancing the results, the initiating node sends a balanced result of the work with the status `reached` to all nodes.
In the event that the voting ends with a timeout, a message with the status `timedout` and `null` will be sent instead of the result of the work.
