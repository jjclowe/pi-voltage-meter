var gpio = require("rpi-gpio");
var gpiop = gpio.promise;

function output(channel, value) {
  return new Promise((resolve, reject) => {
    gpio.output(channel, value, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function input(channel) {
  return new Promise((resolve, reject) => {
    gpio.input(channel, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}

async function getReadings() {
  const voltages = [];

  for (let y = 0; y < 8; y++) {
    let word = [];
    if (y === 0) word = [1, 1, 0, 0, 0, 1, 1]; // set channel 0
    if (y === 1) word = [1, 1, 0, 0, 1, 1, 1]; // set channel 1
    if (y === 2) word = [1, 1, 0, 1, 0, 1, 1]; // set channel 2
    if (y === 3) word = [1, 1, 0, 1, 1, 1, 1]; // set channel 3
    if (y === 4) word = [1, 1, 1, 0, 0, 1, 1]; // set channel 4
    if (y === 5) word = [1, 1, 1, 0, 1, 1, 1]; // set channel 5
    if (y === 6) word = [1, 1, 1, 1, 0, 1, 1]; // set channel 6
    if (y === 7) word = [1, 1, 1, 1, 1, 1, 1]; // set channel 7

    await output(24, false);
    let anip = 0;

    for (let x = 0; x < 7; x++) {
      await output(19, word[x]);
      // await sleep(10);
      await output(23, true);
      // await sleep(10);
      await output(23, false);
    }

    for (let x = 0; x < 12; x++) {
      await output(23, true);
      // await sleep(10);
      let bit = await input(21);
      // await sleep(10);
      await output(23, false);

      // console.log(bit);

      let value = bit * 2 ** (12 - x - 1); //work out value of this bit

      // console.log(value);

      anip = anip + value; // add to previous total

      await output(24, true);
    }
    let volt = (anip * 2.5) / 4096; //use ref voltage of 2.5 to work out voltage

    voltages.push(volt);
  }

  // await sleep(10);

  return voltages;
}

async function main() {
  // await gpio.setMode(gpio.MODE_BCM);

  await gpiop.setup(24, gpio.DIR_OUT);
  await gpiop.setup(23, gpio.DIR_OUT);
  await gpiop.setup(19, gpio.DIR_OUT);
  await gpiop.setup(21, gpio.DIR_IN);

  // set pins to default state
  await output(24, true);
  await output(23, false);
  await output(19, true);

  do {
    const voltages = await getReadings();
    console.log(`${Date.now()}: ${voltages}`);
  } while (1 === 1);
}

main();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
