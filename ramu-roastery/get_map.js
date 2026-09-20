/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');
const options = {
  hostname: 'www.google.com',
  path: '/share.google?q=BKvPny7x9Gi31hWBm',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};
https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // try to match title or meta property="og:title"
    const match = data.match(/<title>(.*?)<\/title>/);
    const meta = data.match(/<meta property="og:title" content="(.*?)"/);
    console.log("Title: " + (match ? match[1] : "not found"));
    console.log("Meta: " + (meta ? meta[1] : "not found"));
  });
}).on('error', (e) => {
  console.error(e);
});
