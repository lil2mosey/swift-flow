
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Firestore, initializeFirestore, getFirestore as getFirestoreRegular } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Next.js in a Studio environment.
 * Strictly enforces a global singleton to prevent ca9 assertion failures during navigation.
 */
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    const globalStore = window as any;

    if (globalStore.__firebaseApp && globalStore.__firebaseDb && globalStore.__firebaseAuth) {
      return {
        firebaseApp: globalStore.__firebaseApp,
        auth: globalStore.__firebaseAuth,
        firestore: globalStore.__firebaseDb
      };
    }

    const apps = getApps();
    let app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

    let db: Firestore;
    try {
      // Force long polling for reliable studio development
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      db = getFirestoreRegular(app);
    }

    const auth = getAuth(app);

    globalStore.__firebaseApp = app;
    globalStore.__firebaseDb = db;
    globalStore.__firebaseAuth = auth;

    return {
      firebaseApp: app,
      auth: auth,
      firestore: db
    };
  }

  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestoreRegular(app)
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  const { auth, firestore } = initializeFirebase();
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
