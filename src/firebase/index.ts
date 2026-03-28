'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

/**
 * Robust Firebase initialization for Next.js.
 * Ensures Firestore settings like long polling are applied exactly once.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    if (!auth) {
      auth = getAuth(app);
    }

    if (!db) {
      // CRITICAL: initializeFirestore with experimentalForceLongPolling MUST be called
      // only once per app. This resolves "FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch (e) {
        // If already initialized, use getFirestore to retrieve the existing instance.
        db = getFirestore(app);
      }
    }
  }

  return {
    firebaseApp: app,
    auth: auth,
    firestore: db
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
