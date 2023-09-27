import Docker from "dockerode";
import { generateRandomBigInt, generateGroupParameters, generateRandomPolynomial } from "./gennaro_dkg.js"
import { modularExponentiation, hexToBytes, subscribeTopic, sendMessage, receiveMessage } from "./utils.js"
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
console.log("q: ", q)
 
//#endregion

//#region Main
await subscribeTopic(container, "my_topic_1", wakuIp)
  .then((output) => {
    console.log('Connected!');
  })
  .catch((error) => {
    console.error('Error:', error);
  });

//JOINT KEY GENERATION  
const t0 = performance.now();
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
  let polynomial_0 = generateRandomPolynomial(1, q);  
  let polynomial_0_second = generateRandomPolynomial(1, q); 

  let alices_secret_share_poly0 = (polynomial_0[0] + polynomial_0[1]) % q
  let secret_shares = [alices_secret_share_poly0 * BigInt(2)]

  const h = generatePublicValue(p, q, g)
  let broadcast_value = (polynomial_0[0] + polynomial_0[1] * BigInt(2)) % q;
  let broadcast_value_second = (polynomial_0_second[0] + polynomial_0_second[1] * BigInt(2)) % q;
  let C_0 = modularExponentiation(g, broadcast_value, p) * modularExponentiation(h, broadcast_value_second, p)
  let A_0 = modularExponentiation(g, broadcast_value, p)
  const polynomial_0_hex = greenweb.util.key.hexToPrivateKey(polynomial_0[0].toString("16"))
  const polynomial_0_hex_public_key = polynomial_0_hex.get_g1();
  let gf_0 = greenweb.util.key.publicKeyToHex(polynomial_0_hex_public_key);

  let C_1 = 0
  let A_1 = 0
  let received_p1_shares = []
  let public_key_share = '';

  let broadcast = [h, C_0, broadcast_value, broadcast_value_second, gf_0, A_0]
  await sendMessage(container, "my_topic_2", broadcast.toString(), wakuIp)
    .then(() => {
    console.log('h, C_0, first_share, second_share, public_key_share, A_0 are sent:', gf_0, A_0);
    })
    .catch((error) => {
      console.error('Error:', error);
    });

  let received_values = []
  await receiveMessage(container, "my_topic_1", wakuIp)
    .then((output) => {
      received_values = output.split(",")
      console.log("h, C_1, first_share, second_share, public_key_share are received: ", received_values)
      C_1 = BigInt(received_values[1])
      received_p1_shares.push(BigInt(received_values[2]))
      received_p1_shares.push(BigInt(received_values[3]))
      public_key_share = received_values[4]
      A_1 = BigInt(received_values[5])
    })
    .catch((error) => {
      console.error('Error:', error);
    });
    
  let verification_C_1 = modularExponentiation(g, received_p1_shares[0], p) * modularExponentiation(h, received_p1_shares[1], p)
  if(verification_C_1 != C_1) {
    throw new Error("Received shares are not valid!");
  }
    
  let verification_A_1 = modularExponentiation(g, received_p1_shares[0], p)
  if(verification_A_1 != A_1) {
    throw new Error("Received public key share is not valid!");
  }

  let public_key = greenweb.util.key.publicKeyToHex(polynomial_0_hex_public_key.add(greenweb.clvm.G1Element_from_bytes(hexToBytes(public_key_share))));
  secret_shares.push(BigInt(received_p1_shares[0]) * BigInt(-1))

  let secret_share = (secret_shares[0] + secret_shares[1]) % q
  
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


function generatePublicValue(p, q, g) {
  // Calculate k = (p - 1) / q
  const k = (p - 1n) / q;

  // Generate a random value r in Z*p
  const r = generateRandomBigInt(BigInt(1), p);

  // Calculate h = g^r mod p
  const h = modularExponentiation(g, r, p);

  return h;
}
//#endregion