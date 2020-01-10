const { Storage } = require('@google-cloud/storage');
const { Duplex } = require('stream');
const storage = new Storage();
const bucket = storage.bucket('bgov-web-preferences');

const save = (preference, gcFile) =>
  new Promise((resolve, reject) => {
    const stream = new Duplex();
    stream.push(preference);
    stream.push(null);
    stream
      .pipe(
        gcFile.createWriteStream({
          resumable: false,
          validation: false,
          contentType: 'auto',
          metadata: {
            'Cache-Control': 'public, max-age=31536000',
          },
        }),
      )
      .on('error', error => {
        reject(error);
      })
      .on('finish', () => {
        resolve(true);
      });
  });
const gcFile = bucket.file('test.pref');
gcFile.download().then(r => console.log('r')).catch(e => console.log(e.code === 404));
