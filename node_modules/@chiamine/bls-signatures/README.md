# Important Notice

This is unofficial patch build for the latest js-bindings of [bls-signatures](https://github.com/Chia-Network/bls-signatures).  
Consider this branch as a temporary package instead of the unknown `0.2.5` version package published at the npm registry.

**The problem**

If you install `bls-signatures` via `npm install bls-signature`, you will install `bls-signatures` of version 0.2.5,
whose source code has not yet been published to the original [GitHub repository](https://github.com/Chia-Network/bls-signatures).  
(Maybe a developer built and published its private source code into the npm registry)

I created this branch because I'm worried to run this unknown '0.2.5' version of `bls-signatures` on my own computer.

**How to reproduce this unofficial npm package**  

You will(or should) ask me something like  
"How can I trust this unofficial npm package instead of the one in original npm registry?"

I'm telling you how you can trust this package, by showing how to reproduce the content of this repository precisely.

0. Check node/cmake/emscripten exists in your environment or install them if they are missing.  
See https://emscripten.org/docs/getting_started/downloads.html for emscripten installation.  
For my current environment, I use
   - Ubuntu Ubuntu 20.04.2
   - emsdk 2.0.23 (77b065ace39e6ab21446e13f92897f956c80476a)
   - node-14.15.5-64bit
   - cmake 3.16.3

1. Git clone from the trusted source code
```shell
cd <directory you like>
git clone https://github.com/Chia-Network/bls-signatures
cd bls-signatures
git checkout f9db7faa370c4743e48be8a9823232e4d906c4d0 # You will be warned by git as it is `detached-state` but don't worry.
```
2. Build js-binding
```shell
mkdir js_build && cd js_build
cmake ../ -DCMAKE_TOOLCHAIN_FILE=/PATH-TO-EMSDK-ROOT/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
cmake --build . --
```
3. Check out the products
```shell
ls -l js-bindings/

# You will see output like this.
# The files should be the same as contents of this branch except for this README
#
# drwxrwxr-x 4 chiaminejp chiaminejp   4096  June 16 11:09 CMakeFiles
# -rw-rw-r-- 1 chiaminejp chiaminejp  16817  June 16 11:09 Makefile
# -rw-rw-r-- 1 chiaminejp chiaminejp   6591  June 16 11:09 README.md
# -rw-rw-r-- 1 chiaminejp chiaminejp   4091  June 16 11:09 blsjs.d.ts
# -rw-rw-r-- 1 chiaminejp chiaminejp  47671  June 16 11:10 blsjs.js
# -rwxrwxr-x 1 chiaminejp chiaminejp 248515  June 16 11:10 blsjs.wasm
# -rw-rw-r-- 1 chiaminejp chiaminejp   1002  June 16 11:09 cmake_install.cmake
# -rw-rw-r-- 1 chiaminejp chiaminejp 100600  June 16 11:09 package-lock.json
# -rw-rw-r-- 1 chiaminejp chiaminejp   1290  June 16 11:09 package.json
# drwxrwxr-x 2 chiaminejp chiaminejp   4096  June 16 11:09 tests
```

(4. publish the above content to this branch)  
This process is for me only.  
After build js-bindings of bls-signature, I always edit `README.md` to include this 'Important Notice'.  
In addition to `README.md`, I also edit `package.json` to rename module to `@chiamine/bls-signatures`.  
This is necessary to publish isolated npm package for replacement of official bls-signature@0.2.5.  
**reason why I need isolated npm package**  
I once indicated to install this npm module by  
```shell
npm install Chia-Mine/bls-signatures#npm # Install this npm module from this GitHub repository's npm branch
```
However, there was an issue where sometimes it unexpectedly installed old npm module instead of the latest commit.  
I didn't realize the exact cause, but I guess `npm install` from GitHub sometimes not working and instead tries to fetch
npm files from official npm registry.

So I decided to publish 'scoped' npm module which you can easily install by  
```shell
npm install @chiamine/bls-signatures # or yarn add @chiamine/bls-signatures
```

**Note: This `npm` branch is an orphan branch and not a derivation of any other branches.**  

---

## bls-signatures

JavaScript library that implements BLS signatures with aggregation as in [Boneh, Drijvers, Neven 2018](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html), using the relic toolkit for cryptographic primitives (pairings, EC, hashing).

This library is a JavaScript port of the [Chia Network's BLS lib](https://github.com/Chia-Network/bls-signatures). We also have typings, so you can use it with TypeScript too!

### Usage

```bash
npm i @chiamine/bls-signatures --save # or yarn add @chiamine/bls-signatures
```

### Creating keys and signatures
```javascript
  var loadBls = require("bls-signatures");
  var BLS = await loadBls();
  
  var seed = Uint8Array.from([
    0,  50, 6,  244, 24,  199, 1,  25,  52,  88,  192,
    19, 18, 12, 89,  6,   220, 18, 102, 58,  209, 82,
    12, 62, 89, 110, 182, 9,   44, 20,  254, 22
  ]);
  
  var sk = BLS.AugSchemeMPL.key_gen(seed);
  var pk = sk.get_g1();
  
  var message = Uint8Array.from([1,2,3,4,5]);
  var signature = BLS.AugSchemeMPL.sign(sk, message);
  
  let ok = BLS.AugSchemeMPL.verify(pk, message, signature);
  console.log(ok); // true
```

### Serializing keys and signatures to bytes
```javascript  
  var skBytes = sk.serialize();
  var pkBytes = pk.serialize();
  var signatureBytes = signature.serialize();
  
  console.log(BLS.Util.hex_str(skBytes));
  console.log(BLS.Util.hex_str(pkBytes));
  console.log(BLS.Util.hex_str(signatureBytes));
  
```

### Loading keys and signatures from bytes
```javascript
  var skc = BLS.PrivateKey.from_bytes(skBytes, false);
  var pk = BLS.G1Element.from_bytes(pkBytes);

  var signature = BLS.G2Element.from_bytes(signatureBytes);
```

### Create aggregate signatures
```javascript
  // Generate some more private keys
  seed[0] = 1;
  var sk1 = BLS.AugSchemeMPL.key_gen(seed);
  seed[0] = 2;
  var sk2 = BLS.AugSchemeMPL.key_gen(seed);
  var message2 = Uint8Array.from([1,2,3,4,5,6,7]);
  
  // Generate first sig
  var pk1 = sk1.get_g1();
  var sig1 = BLS.AugSchemeMPL.sign(sk1, message);
  
  // Generate second sig
  var pk2 = sk2.get_g1();
  var sig2 = BLS.AugSchemeMPL.sign(sk2, message2);
  
  // Signatures can be non-interactively combined by anyone
  var aggSig = BLS.AugSchemeMPL.aggregate([sig1, sig2]);
  
  ok = BLS.AugSchemeMPL.aggregate_verify([pk1, pk2], [message, message2], aggSig);
  console.log(ok); // true
  
```

### Arbitrary trees of aggregates
```javascript
  seed[0] = 3;
  var sk3 = BLS.AugSchemeMPL.key_gen(seed);
  var pk3 = sk3.get_g1();
  var message3 = Uint8Array.from([100, 2, 254, 88, 90, 45, 23]);
  var sig3 = BLS.AugSchemeMPL.sign(sk3, message3);
  
  var aggSigFinal = BLS.AugSchemeMPL.aggregate([aggSig, sig3]);
  ok = BLS.AugSchemeMPL.aggregate_verify([pk1, pk2, pk3], [message, message2, message3], aggSigFinal);
  console.log(ok); // true
```

### Very fast verification with Proof of Possession scheme
```javascript

  // If the same message is signed, you can use Proof of Posession (PopScheme) for efficiency
  // A proof of possession MUST be passed around with the PK to ensure security.
  var popSig1 = BLS.PopSchemeMPL.sign(sk1, message);
  var popSig2 = BLS.PopSchemeMPL.sign(sk2, message);
  var popSig3 = BLS.PopSchemeMPL.sign(sk3, message);
  var pop1 = BLS.PopSchemeMPL.pop_prove(sk1);
  var pop2 = BLS.PopSchemeMPL.pop_prove(sk2);
  var pop3 = BLS.PopSchemeMPL.pop_prove(sk3);
  
  ok = BLS.PopSchemeMPL.pop_verify(pk1, pop1);
  console.log(ok); // true
  ok = BLS.PopSchemeMPL.pop_verify(pk2, pop2);
  console.log(ok); // true
  ok = BLS.PopSchemeMPL.pop_verify(pk3, pop3);
  console.log(ok); // true
  
  var popSigAgg = BLS.PopSchemeMPL.aggregate([popSig1, popSig2, popSig3]);
  ok = BLS.PopSchemeMPL.fast_aggregate_verify([pk1, pk2, pk3], message, popSigAgg);
  console.log(ok); // true
  
  // Aggregate public key, indistinguishable from a single public key
  var popAggPk = pk1.add(pk2).add(pk3);
  ok = BLS.PopSchemeMPL.verify(popAggPk, message, popSigAgg);
  console.log(ok); // true
  
  // Aggregate private keys
  var aggSk = BLS.PrivateKey.aggregate([sk1, sk2, sk3]);
  ok = (BLS.PopSchemeMPL.sign(aggSk, message).equal_to(popSigAgg));
  console.log(ok); // true
```

### HD keys using [EIP-2333](https://github.com/ethereum/EIPs/pull/2333)
```javascript
  // You can derive 'child' keys from any key, to create arbitrary trees. 4 byte indeces are used.
  // Hardened (more secure, but no parent pk -> child pk)
  var masterSk = BLS.AugSchemeMPL.key_gen(seed);
  var child = BLS.AugSchemeMPL.derive_child_sk(masterSk, 152);
  var grandChild = BLS.AugSchemeMPL.derive_child_sk(child, 952);
  
  // Unhardened (less secure, but can go from parent pk -> child pk), BIP32 style
  var masterPk = masterSk.get_g1();
  var childU = BLS.AugSchemeMPL.derive_child_sk_unhardened(masterSk, 22);
  var grandchildU = BLS.AugSchemeMPL.derive_child_sk_unhardened(childU, 0);
  
  var childUPk = BLS.AugSchemeMPL.derive_child_pk_unhardened(masterPk, 22);
  var grandchildUPk = BLS.AugSchemeMPL.derive_child_pk_unhardened(childUPk, 0);
  
  ok = (grandchildUPk.equal_to(grandchildU.get_g1()));
  console.log(ok); // true
```

Please refer to the library's [typings](./blsjs.d.ts) for detailed API information. Use cases can be found in the [original lib's readme](../README.md).

__Important note on usage:__ Since this library is a WebAssembly port of the c++ library, JavaScript's automatic memory management isn't available. Please, delete all objects manually if they are not needed anymore by calling the delete method on them, as shown in the example below.

```javascript
  sk.delete();
  // ...
  pk.delete();
  // ...
  sig1.delete();
  // ...
```

### Build

Building requires Node.js (with npm) and [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) to be installed.
The build process is the same as for the c++ lib, with one additional step: pass the Emscripten toolchain file as an option to CMake.
From the project root directory, run:
```
#git submodule update --init --recursive
mkdir js_build
cd js_build
cmake ../ -DCMAKE_TOOLCHAIN_FILE={path_to_your_emscripten_installation}/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
cmake --build . --
```

Run the build after any changes to the library, including readme and tests, as the library will be deployed from the build directory, and the build system copies all the files from the source dir.
### Run tests
Tests are run in node.js and Firefox, therefore you need to install node.js and Firefox.
To run tests, build the library, then go to the `js_bindings` folder in the build directory and run
```bash
npm test
```
