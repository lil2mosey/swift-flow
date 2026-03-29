'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Enterprise-grade Firebase initialization.
 * Optimized for Vercel/Serverless environments to prevent multiple initializations
 * and the "ca9" assertion errors during navigation.
 */
export function initializeFirebase() {
  const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth: Auth = getAuth(app);
  const firestore: Firestore = getFirestore(app);

  return { firebaseApp: app, auth, firestore };
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
