'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    } else {
      // Initialize via config object for Studio environment
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);

      // Initialize Firestore with long polling for maximum stability in the Studio environment.
      // This resolves "FIRESTORE INTERNAL ASSERTION FAILED" and connectivity issues.
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
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
