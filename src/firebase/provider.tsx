'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { UserProfile } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true,
    isProfileLoading: true, // Start true for initial boot
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState(prev => ({ ...prev, isUserLoading: false, isProfileLoading: false }));
      return;
    }

    // Set persistence to LOCAL for presentation consistency
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUserAuthState(prev => ({ 
            ...prev, 
            user: firebaseUser, 
            isUserLoading: false,
            isProfileLoading: true 
          }));

          const profileRef = doc(firestore, 'users', firebaseUser.uid);
          const unsubscribeProfile = onSnapshot(
            profileRef,
            (docSnap) => {
              const profileData = docSnap.exists() ? (docSnap.data() as UserProfile) : null;
              setUserAuthState(prev => ({
                ...prev,
                profile: profileData,
                isProfileLoading: false,
                userError: null
              }));
            },
            (error) => {
              setUserAuthState(prev => ({
                ...prev,
                isProfileLoading: false,
                userError: error
              }));
            }
          );
          return () => unsubscribeProfile();
        } else {
          setUserAuthState({ 
            user: null, 
            profile: null, 
            isUserLoading: false, 
            isProfileLoading: false,
            userError: null 
          });
        }
      },
      (error) => {
        setUserAuthState({ 
          user: null, 
          profile: null, 
          isUserLoading: false, 
          isProfileLoading: false,
          userError: error 
        });
      }
    );

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    profile: context.profile,
    isUserLoading: context.isUserLoading,
    isProfileLoading: context.isProfileLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps) as T & {__memo?: boolean};
  if(typeof memoized === 'object' && memoized !== null) {
    memoized.__memo = true;
  }
  return memoized;
}

export const useUser = () => {
  const { user, profile, isUserLoading, isProfileLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, isProfileLoading, userError };
};
