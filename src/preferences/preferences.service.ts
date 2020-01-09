import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { Duplex } from 'stream';
import { from, Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

export class Preference {
  id: string;
  v: number;
}

// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class PreferencesService {
  bucket;
  pubsub;
  pipeline: Subject<Preference>;
  topicName = 'BgovBackendPreference';
  bucketName = 'bgov-web-preferences';

  constructor() {
    const storage = new Storage();
    this.pubsub = new PubSub();
    this.bucket = storage.bucket(this.bucketName);
    this.pipeline = new Subject<Preference>();
    this.pipeline.pipe(
      concatMap(preference => from(this.readCurrentAndVersion(preference))),
      concatMap(preference => from(this.save(preference))),
      concatMap(preference => from(this.saveResult(preference))),
    );
  }

  isWritable(oldPref, newPref) {
    if (newPref.v !== oldPref.v + 1) {
      throw new Error('Conflict detected. Aborting');
    }
    return newPref;
  }

  async saveResult(preference) {
    const data = JSON.stringify(preference);
    const dataBuffer = Buffer.from(data);
    return await this.pubsub.topic(this.topicName).publish(dataBuffer);
  }

  async readCurrentAndVersion(preference) {
    const gcFile = this.bucket.file(preference.id + '.pref');
    const file = await gcFile.download();
    const oldPref = JSON.parse(file.toString());
    return this.isWritable(oldPref, preference);
  }

  save(preference) {
    const gcFile = this.bucket.file(preference.id + '.pref');
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
          resolve(preference);
        });
    });
  }
}
