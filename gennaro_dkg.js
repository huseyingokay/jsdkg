export function generateGroupParameters() {    
    return {
        p: "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab",
        g: "0x0a989badd40d6212b33cffc3f3763e9bc760f988c9926b26da9dd85e928483446346b8ed00e1de5d5ea93e354abe706c", 
        q: "0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001"
    };
}

export function generateRandomPolynomial(degree, q) {
  const polynomial = [];

  for (let i = 0; i <= degree; i++) {
    let random_big_int = generateRandomBigInt(BigInt(1), (q - BigInt(10 ** 76)))

    while(random_big_int.toString("16").length != 64){
      random_big_int = generateRandomBigInt(BigInt(1), q)
    }
    polynomial.push(random_big_int);
  }

  return polynomial;
}

export function generateRandomBigInt(low_big_int, high_big_int) {
  if (low_big_int >= high_big_int) {
    throw new Error('low_big_int must be smaller than high_big_int');
  }

  const difference = high_big_int - low_big_int;
  const difference_length = difference.toString().length;
  let multiplier = '';
  while (multiplier.length < difference_length) {
    multiplier += Math.random()
      .toString()
      .split('.')[1];
  }
  multiplier = multiplier.slice(0, difference_length);
  const divisor = '1' + '0'.repeat(difference_length);

  const random_difference = (difference * BigInt(multiplier)) / BigInt(divisor);

  return low_big_int + random_difference;
}
