// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
import "firebase/compat/auth";
import "firebase/compat/database";
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLx3aAmtzSAEg6kbo9HKVtufUzC-QidMM",
  authDomain: "projetwhatsup.firebaseapp.com",
  databaseURL: "https://projetwhatsup-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "projetwhatsup",
  storageBucket: "projetwhatsup.firebasestorage.app",
  messagingSenderId: "391124102219",
  appId: "1:391124102219:web:ec6ba0629197540ff0f1ce"
};

// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);
export default firebase;