// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/storage";
// Supabase imports
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLx3aAmtzSAEg6kbo9HKVtufUzC-QidMM",
  authDomain: "projetwhatsup.firebaseapp.com",
  databaseURL: "https://projetwhatsup-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "projetwhatsup",
  messagingSenderId: "391124102219",
  appId: "1:391124102219:web:ec6ba0629197540ff0f1ce"
};

// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);

// Supabase configuration
const supabaseUrl = 'https://ujhjzhxeejwtozouqfjf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqaGp6aHhlZWp3dG96b3VxZmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMzgxMTQsImV4cCI6MjA2MTYxNDExNH0.Wl4CgUIs1hMDXzQoAJ4hkAVocdGW_CAU4My-GUrYp5o';

const options = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

// Initialize Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Export Firebase as default
export default firebase;
