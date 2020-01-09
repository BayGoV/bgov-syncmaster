import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { Duplex } from 'stream';

@Injectable()
export class PreferencesService {
  bucket;

  constructor() {
    const storage = new Storage();
    this.bucket = storage.bucket('bgov-web-preferences');
  }

  async readCurrent(id) {
    let preference = null;
    try {
      const gcFile = this.bucket.file(id + '.pref');
      const file = await gcFile.download();
      preference = JSON.parse(file.toString());
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('Unable to read pref');
    }
    return preference;
  }

  save(preference, gcFile) {
    return new Promise((resolve, reject) => {
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
  }
}
