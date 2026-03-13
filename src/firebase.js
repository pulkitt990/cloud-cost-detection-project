import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyChGIzwJAHnSWLQRsd4m8_mtwj903IRwmg",
  authDomain: "cloud-cost-control-fc86e.firebaseapp.com",
  projectId: "cloud-cost-control-fc86e",
  storageBucket: "cloud-cost-control-fc86e.firebasestorage.app",
  messagingSenderId: "999151125411",
  appId: "1:999151125411:web:62dc2ff8b4822485a1d016"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
