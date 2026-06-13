const fs = require('fs');
const path = require('path');
const https = require('https');

const urls = [
  { url: 'https://static.wikia.nocookie.net/despicableme/images/c/ca/Bob_the_Minion_sitting.png/revision/latest', name: 'minion_bob.png' },
  { url: 'https://static.wikia.nocookie.net/despicableme/images/1/1d/Stuart_the_Minion_sitting.png/revision/latest', name: 'minion_stuart.png' },
  { url: 'https://static.wikia.nocookie.net/despicableme/images/8/8d/Kevin_the_Minion_in_Minions_film.png/revision/latest', name: 'minion_kevin.png' },
  { url: 'https://static.wikia.nocookie.net/despicableme/images/3/3e/King_Bob.png/revision/latest', name: 'minion_kingbob.png' },
  { url: 'https://static.wikia.nocookie.net/despicableme/images/c/c4/Evil_Minion_standing.png/revision/latest', name: 'minion_evil.png' },
  { url: 'https://static.wikia.nocookie.net/despicableme/images/5/5e/Mel_the_Minion.png/revision/latest', name: 'minion_mel.png' }
];

const destDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(destDir, filename));
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename} successfully.`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(destDir, filename), () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of urls) {
    try {
      await download(item.url, item.name);
    } catch (e) {
      console.error(e.message);
    }
  }
}

run();
