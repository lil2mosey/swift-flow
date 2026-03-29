'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Firestore, initializeFirestore, getFirestore as getFirestoreRegular } from 'firebase/firestore';

/**
 * Reinforced Firebase initialization for production environments like Vercel.
 * Prevents "Expected state (ID: ca9)" and "b815" errors by strictly enforcing a global singleton.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const globalStore = window as any;

    // Check if we already have a specialized singleton attached to the window
    if (globalStore.__firebaseApp && globalStore.__firebaseDb && globalStore.__firebaseAuth) {
      return {
        firebaseApp: globalStore.__firebaseApp,
        auth: globalStore.__firebaseAuth,
        firestore: globalStore.__firebaseDb
      };
    }

    const apps = getApps();
    let app: FirebaseApp;
    
    // Use existing app if available, otherwise initialize
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    let db: Firestore;
    try {
      // Use initializeFirestore to force long polling, which is more stable in studio/serverless environments
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      db = getFirestoreRegular(app);
    }

    const auth = getAuth(app);

    // Attach to window to persist through HMR and navigation
    globalStore.__firebaseApp = app;
    globalStore.__firebaseDb = db;
    globalStore.__firebaseAuth = auth;

    return {
      firebaseApp: app,
      auth: auth,
      firestore: db
    };
  }

  // Fallback for SSR/Build environments
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestoreRegular(app)
  };
}

export function getSdks() {
  return initializeFirebase();
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
