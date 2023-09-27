import Docker from "dockerode";
import { generateGroupParameters, generateRandomPolynomial } from "./gennaro_dkg.js"
import { modularExponentiation,  hexToBytes, subscribeTopic, sendMessage, receiveMessage } from "./utils.js"
import greenweb from "greenwebjs"

const dockerContainerId = "787369dd5649de8056198f078f339c64d9f5b8c65d27ee0f71c9dedca99b454d";
const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});
const container = docker.getContainer(dockerContainerId);
const wakuIp = "127.0.0.1:8548"

await greenweb.clvm.initializeBLS()

//#region Variables
const groupParameters = generateGroupParameters();
const q = BigInt(parseInt(groupParameters.q, 16));
const g = BigInt(parseInt(groupParameters.g, 16));
const p = BigInt(parseInt(groupParameters.p, 16));
//#endregion

//#region Main
await subscribeTopic(container, "my_topic_2", wakuIp)
  .then(() => {
    console.log('Connected!');
  })
  .catch((error) => {
    console.error('Error:', error);
  });

//JOINT KEY GENERATION  

await gennaroDkg(container)
  .then((output) => {
    let alice_joint_address_public_key = output.public_key
    let alice_joint_address_secret_share = output.secret_share
    console.log("alice_joint_secret_share: ", alice_joint_address_secret_share)
    console.log("alice_joint_public_key: ", alice_joint_address_public_key)
  })

await gennaroDkg(container)
  .then((output) => {
    let bob_joint_address_public_key = output.public_key
    let bob_joint_address_secret_share = output.secret_share
    console.log("bob_joint_secret_share: ", bob_joint_address_secret_share)
    console.log("bob_joint_public_key: ", bob_joint_address_public_key)
  })

//#endregion

//#region Helper Functions
async function gennaroDkg(){
  let polynomial_1 = generateRandomPolynomial(1, q);  
  let polynomial_1_second = generateRandomPolynomial(1, q); 

  let bobs_secret_share_poly1 = (polynomial_1[0] + polynomial_1[1]) % q
  let secret_shares = [bobs_secret_share_poly1  * BigInt(2)]

  let h = 0
  let broadcast_value = (polynomial_1[0] + polynomial_1[1] * BigInt(2)) % q;
  let broadcast_value_second = (polynomial_1_second[0] + polynomial_1_second[1] * BigInt(2)) % q;
  const polynomial_1_hex = greenweb.util.key.hexToPrivateKey("0x" + polynomial_1[0].toString("16"))
  const polynomial_1_hex_public_key = polynomial_1_hex.get_g1();
  let gf_1 = greenweb.util.key.publicKeyToHex(polynomial_1_hex_public_key);

  let C_0 = 0
  let A_0 = 0
  let received_p0_shares = []
  let public_key_share = '';

  let received_values = []
  await receiveMessage(container, "my_topic_2", wakuIp)
    .then((output) => {
      received_values = output.split(",")
      console.log("h, C_0, first_share, second_share, public_key_share, A_0 are received: ", received_values)
      h = BigInt(received_values[0])
      C_0 = BigInt(received_values[1])
      received_p0_shares.push(BigInt(received_values[2]))
      received_p0_shares.push(BigInt(received_values[3]))
      public_key_share = received_values[4]
      A_0 = BigInt(received_values[5])
    })
    .catch((error) => {
      console.error('Error:', error);
    });

  let C_1 = modularExponentiation(g, broadcast_value, p) * modularExponentiation(h, broadcast_value_second, p)
  let A_1 = modularExponentiation(g, broadcast_value, p)

  let verification_C_0 = modularExponentiation(g, received_p0_shares[0], p) * modularExponentiation(h, received_p0_shares[1], p)
  if(verification_C_0 != C_0) {
    throw new Error("Received shares are not valid!");
  }

  let verification_A_0 = modularExponentiation(g, received_p0_shares[0], p)
  if(verification_A_0 != A_0) {
    throw new Error("Received public key share is not valid!");
  }

  let broadcast = [h, C_1, broadcast_value, broadcast_value_second, gf_1, A_1]
  await sendMessage(container, "my_topic_1", broadcast.toString(), wakuIp)
    .then(() => {
    console.log('h, C_1, first_share, second_share, public_key_share, A_1 are sent:', broadcast);
    })
    .catch((error) => {
      console.error('Error:', error);
    });

  let public_key = greenweb.util.key.publicKeyToHex(polynomial_1_hex_public_key.add(greenweb.clvm.G1Element_from_bytes(hexToBytes(public_key_share))));
  secret_shares.push(BigInt(received_p0_shares[0]) * BigInt(-1))

  let secret_share = secret_shares[0] + secret_shares[1]

  while(secret_share < BigInt(0) || secret_share.toString("16").length < 64)
    secret_share = secret_share + q
  
  let output = {
    public_key: public_key,
    secret_share: secret_share
  }

  return new Promise((resolve) => {
    resolve(output)
  })
}

//#endregion