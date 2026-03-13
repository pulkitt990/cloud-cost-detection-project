import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyChGIzwJAHnSWLQRsd4m8_mMO7P3nmAFCI",
  authDomain: "cloud-cost-control-fc86e.firebaseapp.com",
  projectId: "cloud-cost-control-fc86e",
  storageBucket: "cloud-cost-control-fc86e.firebasestorage.app",
  messagingSenderId: "823811813370",
  appId: "1:823811813370:web:4f5ace1de576c3d6e3d7ea"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
