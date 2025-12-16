import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firestore: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        privateKey,
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
      }),
      storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
    });

    this.firestore = admin.firestore();
    this.storage = admin.storage();
  }

  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }

  getStorage(): admin.storage.Storage {
    return this.storage;
  }

  getStorageBucket(): Bucket {
    return this.storage.bucket();
  }
}
