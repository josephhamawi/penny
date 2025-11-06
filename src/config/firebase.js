import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Firebase project configuration
// Project: expenses-64949
const firebaseConfig = {
  apiKey: "AIzaSyCVkypVjUxN4HdeRmGotHM36Vp8fycPzNY",
  authDomain: "expenses-64949.firebaseapp.com",
  projectId: "expenses-64949",
  storageBucket: "expenses-64949.firebasestorage.app",
  messagingSenderId: "896051349073",
  appId: "1:896051349073:web:89c2f05a87a71708125a70"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export auth and firestore
export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase;
