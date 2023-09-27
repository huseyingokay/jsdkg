import { Writable } from 'stream';
import greenweb from "greenwebjs"

const fireblocksApiKey = 'c28c3cfb-5c8d-4f03-9268-6198800dcd1e';

export async function subscribeTopic(container, topic, ip_port) {
    let finalOutput = '';
  
    return new Promise((resolve, reject) => {
      container.exec(
        {
          Cmd: [
            'curl',
            '-d',
            `{"jsonrpc":"2.0","method":"post_waku_v2_relay_v1_subscriptions","params":[["${topic}"]],"id":"id"}`,
            '-H',
            'Content-Type: application/json',
            ip_port,
          ],
          AttachStdout: true
        },
        (err, exec) => {
          if (err) {
            console.error('Error executing command:', err);
            reject(err);
            return;
          }
  
          exec.start((err, stream) => {
            if (err) {
              console.error('Error starting command:', err);
              reject(err);
              return;
            }
  
            const { demuxStream } = container.modem;
            const writableStream = new Writable();
  
            writableStream._write = (chunk, encoding, next) => {
              finalOutput += chunk.toString();
              next();
            };
  
            demuxStream(stream, writableStream, process.stderr);
  
            stream.on('end', () => {
              exec.inspect((err, data) => {
                if (err) {
                  console.error('Error inspecting command:', err);
                  reject(err);
                  return;
                }
  
                if (data.ExitCode === 0) {
                  resolve(finalOutput);
                } else {
                  reject(new Error(`Command failed with exit code: ${data.ExitCode}`));
                }
              });
            });
          });
        }
      );
    });
}

export async function sendMessage(container, topic, message, ip_port) {
    message = stringToBase64(message)
    const cmdArray = [
      'curl',
      '-d',
      `{"jsonrpc":"2.0","method":"post_waku_v2_relay_v1_message","params":["${topic}",{"payload": "${message}","timestamp": 1626813243}],"id":"id"}`,
      '-H',
      'Content-Type: application/json',
      ip_port,
    ];
    return new Promise((resolve, reject) => {
      container.exec(
        {
          Cmd: cmdArray,
          AttachStdout: true
        },
        (err, exec) => {
          if (err) {
            console.error('Error executing command:', err);
            reject(err);
            return;
          }
  
          exec.start((err, stream) => {
            if (err) {
              console.error('Error starting command:', err);
              reject(err);
              return;
            }
            resolve(readMessage(container, exec, stream))
          });
        }
      );
    });
  }

async function readMessage(container, exec, stream) {
    let finalOutput = "";
    const { demuxStream } = container.modem;
    const writableStream = new Writable();

    return new Promise((resolve, reject) => {
        writableStream._write = (chunk, encoding, next) => {
        finalOutput += chunk.toString();
        next();
        };

        demuxStream(stream, writableStream, process.stderr);

        stream.on('end', () => {
        exec.inspect((err, data) => {
            if (err) {
            console.error('Error inspecting command:', err);
            reject(err);
            return;
            }

            if (data.ExitCode === 0) {
            resolve(finalOutput);
            } else {
            reject(new Error(`Command failed with exit code: ${data.ExitCode}`));
            }
        });
        });
    });
}
  
export async function receiveMessage(container, topic, ip_port) {
    let finalOutput = '';

    return new Promise((resolve, reject) => {
        container.exec(
        {
            Cmd: [
            'curl',
            '-d',
            `{"jsonrpc":"2.0","method":"get_waku_v2_relay_v1_messages","params":["${topic}"],"id":"id"}`,
            '-H',
            'Content-Type: application/json',
            ip_port,
            ],
            AttachStdout: true
        },
        (err, exec) => {
            if (err) {
            console.error('Error executing command:', err);
            reject(err);
            return;
            }

            exec.start((err, stream) => {
            if (err) {
                console.error('Error starting command:', err);
                reject(err);
                return;
            }

            const { demuxStream } = container.modem;
            const writableStream = new Writable();

            writableStream._write = (chunk, encoding, next) => {
                finalOutput += chunk.toString();
                next();
            };

            demuxStream(stream, writableStream, process.stderr);

            stream.on('end', () => {
                exec.inspect((err, data) => {
                if (err) {
                    console.error('Error inspecting command:', err);
                    reject(err);
                    return;
                }

                if(JSON.parse(finalOutput).result.length == 0) {
                    setTimeout(() => {
                    resolve(receiveMessage(container, topic, ip_port));
                    }, 1);
                    return
                }

                if (data.ExitCode === 0) {
                    //console.log("Received Hex message:", JSON.parse(finalOutput).result[0].payload)
                    finalOutput = base64String(JSON.parse(finalOutput).result[0].payload)
                    resolve(finalOutput);
                } else {
                    reject(new Error(`Command failed with exit code: ${data.ExitCode}`));
                }
                });
            });
            });
        }
        );
    });
}

export async function testDocker(container, ip_port) {
    let finalOutput = '';
  
    return new Promise((resolve, reject) => {
      container.exec(
        {
          Cmd: [
            'curl',
            '-d',
            '{"jsonrpc":"2.0","method":"get_waku_v2_debug_v1_info","params":[],"id":"id"}',
            '-H',
            'Content-Type: application/json',
            ip_port,
          ],
          AttachStdout: true
        },
        (err, exec) => {
          if (err) {
            console.error('Error executing command:', err);
            reject(err);
            return;
          }
  
          exec.start((err, stream) => {
            if (err) {
              console.error('Error starting command:', err);
              reject(err);
              return;
            }
  
            const { demuxStream } = container.modem;
            const writableStream = new Writable();
  
            writableStream._write = (chunk, encoding, next) => {
              finalOutput += chunk.toString();
              next();
            };
  
            demuxStream(stream, writableStream, process.stderr);
  
            stream.on('end', () => {
              exec.inspect((err, data) => {
                if (err) {
                  console.error('Error inspecting command:', err);
                  reject(err);
                  return;
                }
  
                if (data.ExitCode === 0) {
                  resolve(finalOutput);
                } else {
                  reject(new Error(`Command failed with exit code: ${data.ExitCode}`));
                }
              });
            });
          });
        }
      );
    });
}

export function stringToBase64(str) {
  let base64 = btoa(str);
  const padding = base64.length % 4;

  if (padding > 0) {
      base64 += '='.repeat(4 - padding);
  }

  return base64;
}

export function base64String(base64) {
  base64 = base64.replace(/=+$/, '');
  let decodedString = atob(base64);

  return decodedString;
}

export function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const hexValue = charCode.toString(16);
    hex += hexValue.padStart(2, '0');
  }
  return hex;
}

export function arrayToJsonTransaction(input){
  let output = {
      from: input[0],
      to: input[1],
      value: input[2],
      gas: parseInt(input[3]),
      gasPrice: input[4]
  }
  return output
}

export function JsonToArray(json)
{
	var str = JSON.stringify(json, null, 0);
	var ret = new Uint8Array(str.length);
	for (var i = 0; i < str.length; i++) {
		ret[i] = str.charCodeAt(i);
	}
	return ret
};

export function byteArraytoHexString(byteArray) {
  var s = '0x';
  byteArray.forEach(function(byte) {
    s += ((byte & 0xFF).toString(16)).slice(-2);
  });
  return s;
}

export function hexToBytes(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters.");
  }

  const byteLength = hex.length / 2;
  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < byteLength; i++) {
    const hexByte = hex.substr(i * 2, 2);
    const byteValue = parseInt(hexByte, 16);
    bytes[i] = byteValue;
  }

  return bytes;
}

export function signPartial(coinSpend, secretShare, walletPk) {
  const signatures = []
  const [, conditions, ] = greenweb.util.sexp.conditionsDictForSolution(
      coinSpend.puzzleReveal,
      coinSpend.solution,
      greenweb.util.sexp.MAX_BLOCK_COST_CLVM
  );

  if(conditions !== null) {
      const pk_msg_things = greenweb.util.sexp.pkmPairsForConditionsDict(
          conditions,
          greenweb.util.coin.getId(coinSpend.coin),
          greenweb.util.network.getGenesisChallenge(greenweb.util.network.Network.testnet10)
      );

      for(let [msg] of pk_msg_things) {
          console.log("msg", Buffer.from(msg, "hex"))
          const sig = greenweb.clvm.getBLSModule().AugSchemeMPL.sign_prepend(
              secretShare,
              Buffer.from(msg, "hex"),
              walletPk
          );
          signatures.push(sig);
      }
      
  }

  const sb = new greenweb.util.serializer.types.SpendBundle();
  sb.coinSpends = [coinSpend];
  sb.aggregatedSignature = greenweb.clvm.getBLSModule().AugSchemeMPL.aggregate(signatures)

  return sb;
}



export function modularExponentiation(base, exponent, modulus) {
  if (modulus === 1n) return 0n; // Avoid division by zero

  let result = 1n;
  base = base % modulus;

  while (exponent > 0n) {
      if (exponent % 2n === 1n) {
          result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
  }

  return result;
}