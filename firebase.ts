// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFZQh5scOoKamW-JguBEy15m9ATLdVrE4",
  authDomain: "scim-26227.firebaseapp.com",
  projectId: "scim-26227",
  storageBucket: "scim-26227.firebasestorage.app",
  messagingSenderId: "1031103113672",
  appId: "1:1031103113672:web:a02f4e97f58a30fcf578fd",
  measurementId: "G-PMKSM9EWE4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);