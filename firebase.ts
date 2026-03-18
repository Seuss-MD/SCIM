import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import * as FirebaseAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
  apiKey: "AIzaSyCFZQh5scOoKamW-JguBEy15m9ATLdVrE4",
  authDomain: "scim-26227.firebaseapp.com",
  projectId: "scim-26227",
  storageBucket: "scim-26227.firebasestorage.app",
  messagingSenderId: "1031103113672",
  appId: "1:1031103113672:web:a02f4e97f58a30fcf578fd",
  measurementId: "G-PMKSM9EWE4",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const getReactNativePersistence =
  (FirebaseAuth as any).getReactNativePersistence;

export const auth =
  
  FirebaseAuth.initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);