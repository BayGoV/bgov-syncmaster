import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import { Duplex } from 'stream';
import { from, Subject } from 'rxjs';
import { catchError, concatMap, switchMap, tap } from 'rxjs/operators';
import { sign } from 'jsonwebtoken';

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
  suffix = '.pref';

  constructor() {
    const storage = new Storage();
    this.pubsub = new PubSub();
    this.bucket = storage.bucket(this.bucketName);
    this.pipeline = new Subject<Preference>();
    this.pipeline
      .pipe(
        concatMap(preference =>
          from(this.compareVersions(preference)).pipe(
            switchMap(p => from(this.archive(p))),
            switchMap(p => from(this.save(p))),
            switchMap(p =>
              from(
                this.publishResult(
                  Object.assign({}, p, {
                    s: sign(p, process.env.SYNCMASTER_SECRET),
                  }),
                ),
              ),
            ),
            catchError(e =>
              from(
                this.publishResult(Object.assign({}, preference, { v: -1 })),
              ),
            ),
          ),
        ),
      )
      .subscribe();
  }

  process(data) {
    const jsonMessage = Buffer.from(data, 'base64').toString();
    const preference = JSON.parse(jsonMessage);
    if (!preference.s && preference.v >= 0) {
      this.pipeline.next(preference);
    }
  }

  async archive(preference) {
    const gcFile = this.bucket.file(preference.id + this.suffix);
    try {
      await gcFile.copy(preference.id + this.suffix + '.v' + (preference.v - 1));
    } catch (e) {
      if (e.code === 404) {
        return preference;
      } else {
        throw new Error('Unkonwn read error');
      }
    }
    return preference;
  }

  isConflictVersion(oldPref, newPref) {
    if (newPref.v !== oldPref.v + 1) {
      throw new Error('Conflict detected. Aborting');
    }
    return false;
  }

  async publishResult(preference) {
    const data = JSON.stringify(preference);
    const dataBuffer = Buffer.from(data);
    return await this.pubsub.topic(this.topicName).publish(dataBuffer);
  }

  async compareVersions(preference) {
    let oldPref;
    const gcFile = this.bucket.file(preference.id + this.suffix);
    try {
      const file = await gcFile.download();
      oldPref = JSON.parse(file.toString());
    } catch (e) {
      if (e.code === 404) {
        return preference;
      } else {
        throw new Error('Unkonwn read error');
      }
    }
    this.isConflictVersion(oldPref, preference);
    return preference;
  }

  save(preference) {
    const gcFile = this.bucket.file(preference.id + this.suffix);
    const data = JSON.stringify(preference);
    return new Promise((resolve, reject) => {
      const stream = new Duplex();
      stream.push(data);
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
