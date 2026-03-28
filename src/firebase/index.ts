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
 * Uses a singleton pattern and global window storage to prevent
 * "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
 * This ensures settings like long polling are applied exactly once per session.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const globalStore = window as any;

    // Retrieve from global store if available (survives Hot Module Replacement)
    if (globalStore.__firebaseApp) {
      app = globalStore.__firebaseApp;
      db = globalStore.__firebaseDb;
      auth = globalStore.__firebaseAuth;
    } else {
      const apps = getApps();
      
      // 1. Initialize or retrieve the App
      if (apps.length > 0) {
        app = apps[0];
      } else {
        app = initializeApp(firebaseConfig);
      }

      // 2. Initialize or retrieve Auth
      auth = getAuth(app);

      // 3. Initialize Firestore with required long-polling
      // This is the CRITICAL part for fixing ID: ca9 in Studio environment
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      } catch (e) {
        // If already initialized (rare but possible), fallback to getFirestore
        db = getFirestore(app);
      }

      // Store in global window object to prevent multiple initializations
      globalStore.__firebaseApp = app;
      globalStore.__firebaseDb = db;
      globalStore.__firebaseAuth = auth;
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
