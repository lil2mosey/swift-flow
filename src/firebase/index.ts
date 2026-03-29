'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

// Singleton references
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

/**
 * Robust Firebase initialization for Next.js.
 * Uses a strict singleton pattern and global window storage to prevent
 * "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const globalStore = window as any;

    // 1. Retrieve from global store if already initialized (survives HMR and page transitions)
    if (globalStore.__firebaseApp && globalStore.__firebaseDb && globalStore.__firebaseAuth) {
      return {
        firebaseApp: globalStore.__firebaseApp,
        auth: globalStore.__firebaseAuth,
        firestore: globalStore.__firebaseDb
      };
    }

    const apps = getApps();
    
    // 2. Initialize or retrieve the App
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    // 3. Initialize or retrieve Auth
    auth = getAuth(app);

    // 4. Initialize Firestore with required long-polling
    if (globalStore.__firebaseDb) {
      db = globalStore.__firebaseDb;
    } else {
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch (e) {
        // Fallback if already initialized
        db = getFirestore(app);
      }
    }

    // Store in global window object for absolute singleton consistency
    globalStore.__firebaseApp = app;
    globalStore.__firebaseDb = db;
    globalStore.__firebaseAuth = auth;

    return {
      firebaseApp: app,
      auth: auth,
      firestore: db
    };
  }

  return {
    firebaseApp: app,
    auth: auth,
    firestore: db
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  return {
    firebaseApp,
    auth,
    firestore
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
