import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGgZmhJ_mMezlf7xElisvzJ8l9D758d4g",
  authDomain: "my-chat-app-daaf8.firebaseapp.com",
  projectId: "my-chat-app-daaf8",
  storageBucket: "my-chat-app-daaf8.appspot.com",
  messagingSenderId: "789086064752",
  appId: "1:789086064752:web:d081f1b6832dabca1d64b5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to local storage
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase: Could not set auth persistence.", error);
  });

export { auth, db };