'use client';

/**
 * @fileOverview Redirects legacy Firebase imports to the central Firebase initialization logic.
 */
import { initializeFirebase } from '@/firebase';

const { auth, firestore: db } = initializeFirebase();

export { auth, db };
