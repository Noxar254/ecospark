// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, set, get, onValue, update, remove, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5f0Ej_QiMKxugLejamESRgN0MOO3-Iwo",
  authDomain: "ecospark-cfa7a.firebaseapp.com",
  projectId: "ecospark-cfa7a",
  storageBucket: "ecospark-cfa7a.firebasestorage.app",
  messagingSenderId: "654848550106",
  appId: "1:654848550106:web:6eccfb1e0bb1d98daeb1e3",
  measurementId: "G-WCBCB7J5XT",
  databaseURL: "https://ecospark-cfa7a-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export Firebase services
export {
  app,
  analytics,
  db,
  realtimeDb,
  auth,
  storage,
  // Firestore methods
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  // Realtime Database methods
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  push,
  // Auth methods
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  // Storage methods
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
};
