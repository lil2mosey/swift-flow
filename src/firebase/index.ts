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

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = getApp();
    // Use getFirestore but be aware it might not have the long polling if initialized elsewhere
    db = getFirestore(app);
  } else {
    // Attempt to initialize via Firebase App Hosting environment variables
    // fallback to config object for development
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      app = initializeApp();
    }

    // Initialize Firestore with long polling for maximum stability in the Studio environment.
    // This resolves the "Could not reach Cloud Firestore backend" error and internal assertion failures.
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
