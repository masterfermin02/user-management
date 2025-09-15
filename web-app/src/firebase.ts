import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, DataSnapshot } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DB_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

export function subscribeUsers(cb: (users: any[]) => void) {
  const usersRef = ref(rtdb, "users");
  return onValue(usersRef, (snap: DataSnapshot) => {
    const val = snap.val() ?? {};
    const arr = Object.values(val);
    cb(arr as any[]);
  });
}
