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
 * Uses a singleton pattern to prevent "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 * This ensures settings like long polling are applied exactly once.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const apps = getApps();
    
    // 1. Initialize or retrieve the App
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    // 2. Initialize or retrieve Auth
    if (!auth) {
      auth = getAuth(app);
    }

    // 3. Initialize or retrieve Firestore
    if (!db) {
      // CRITICAL: initializeFirestore with experimentalForceLongPolling MUST be called
      // only once per app session to avoid internal assertion failures.
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch (e) {
        // Fallback to getFirestore if already initialized or custom init fails
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