'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Next.js.
 * Ensures Firestore settings like long polling are applied exactly once.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  let db: Firestore;

  if (getApps().length > 0) {
    app = getApp();
    db = getFirestore(app);
  } else {
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      app = initializeApp();
    } catch (e) {
      // Fallback to config object for development
      app = initializeApp(firebaseConfig);
    }

    // Initialize Firestore with long polling for maximum stability in the Studio environment.
    // This resolves the "Could not reach Cloud Firestore backend" error.
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
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
