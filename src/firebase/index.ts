'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

declare global {
  var __firebase_app: FirebaseApp | undefined;
  var __firebase_auth: Auth | undefined;
  var __firebase_firestore: Firestore | undefined;
}

export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!globalThis.__firebase_app) {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      globalThis.__firebase_app = app;
      globalThis.__firebase_auth = getAuth(app);
      globalThis.__firebase_firestore = getFirestore(app);
    }
    return { 
      firebaseApp: globalThis.__firebase_app!, 
      auth: globalThis.__firebase_auth!, 
      firestore: globalThis.__firebase_firestore! 
    };
  }
  
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return { firebaseApp: app, auth: getAuth(app), firestore: getFirestore(app) };
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
