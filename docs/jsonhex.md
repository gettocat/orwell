[Back to intro](https://github.com/gettocat/orwell/blob/master/docs/intro.md)

# jsonhex
Algorithm for writing structured data in byte-sequence and vice versa. Its difference from json is that it takes up less space, which is important for decentralized algorithms, and also has built-in data integrity control.
The main essence of this algorithm: a serialized object is a byte sequence containing a set of primitives with the following order of bytes:



| Type | KeyName | Value |
| -      | -   |-     |
|    uint8      |     var_str    |  Mixed  |


And as the vector primitives (Object and Array), which also contain the first byte in the list - the number of elements:

| Type | KeyName | Count | Value[] |
| -      | -   |- |-    |
|    uint8      |   var_str |  var_int  |  Mixed[]  |

The only difference between Object and Array is that all elements in the array contain empty keys.

Existing data types:

| Description |	Hex	Type |	Type / value |
|-   |- |- |
|NULL |	0xf0 |	uint8 / 0 |
|BOOLEAN |	0xf7 |	uint8 / 0 or 1 |
|STRING |	0xf1 |	var_str /	String |
|NUMBER |	0xf2 |	var_int	/ Integer |
|FLOAT |	0xf6 |	var_str /	Float |
|ARRAY |	0xf3 |	mixed[] /	Primitives object |
|KEYVAL-OBJECT |	0xf4 |	Mixed[] /	Primitive array |
|FUNCTION |	0xf5 |	var_str / js function |


Prior to serialization, the source object is sorted by key name in ascending order (string comparison).

Mixed type means that the list can be any type from the table above.
Also, this algorithm is described in detail on the wiki page at github https://github.com/gettocat/orwelldb/wiki/7.-Json-hex
