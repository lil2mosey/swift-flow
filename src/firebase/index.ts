'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

// Singleton references to survive re-renders and HMR within the module scope
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

/**
 * Robust Firebase initialization for Next.js.
 * Uses a strict singleton pattern and global window storage to prevent
 * "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 * This ensures settings like long polling are applied exactly once per session.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const globalStore = window as any;

    // 1. Retrieve from global store if already initialized (survives HMR)
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
    // We check the global store again to be absolutely sure we don't re-init Firestore
    if (globalStore.__firebaseDb) {
      db = globalStore.__firebaseDb;
    } else {
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch (e) {
        // Fallback to getFirestore if initializeFirestore fails (already initialized)
        db = getFirestore(app);
      }
    }

    // Store in global window object to prevent multiple initializations across navigations
    globalStore.__firebaseApp = app;
    globalStore.__firebaseDb = db;
    globalStore.__firebaseAuth = auth;
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
