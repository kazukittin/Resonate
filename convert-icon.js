const toIco = require('to-ico');
const fs = require('fs');

async function convert() {
    try {
        const png = fs.readFileSync('F:/Resonate/icon/icon.png');
        const ico = await toIco([png]);
        fs.writeFileSync('F:/Resonate/icon/icon.ico', ico);
        console.log('Icon converted successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

convert();
