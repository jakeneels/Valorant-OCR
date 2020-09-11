
const jimp = require('jimp');

const m = async () => {
    console.log(await f())
};
const f = async () => {
    return jimp.read('../blot.png');
};

m();
