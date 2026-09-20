const fs = require('fs');
const path = require('path');
const buffer = fs.readFileSync(path.join(__dirname, 'public/Topify-logo.png'));

const formData = new FormData();
formData.append('file', new Blob([buffer], { type: 'image/png' }), 'Topify-logo.png');

fetch('http://localhost:3000/api/media', {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(console.log).catch(console.error);
