import { useEffect, useState, useRef, useCallback } from 'react'
import './App.css'
import { query,off, ref, orderByChild, endAt, limitToFirst, onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";
import { createUser, updateUser, deleteUser } from "./api";
import { rtdb } from "./firebase";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [cursor, setCursor] = useState(null); // timestamp cursor
  const [isLoading, setIsLoading] = useState(false);
  const liveRef = useRef(null);

  const PAGE_SIZE = 10;

  const attachLiveWindow = useCallback((startTs) => {
    // Clean up any previous listeners
    if (liveRef.current) off(liveRef.current);
    setIsLoading(true);

    // Build a query for the next page window
    // We sort by updatedAt descending by flipping logic:
    // RTDB orders ascending, so we query "endAt(startTs || now)" then limitToLast(PAGE_SIZE)
    const now = Date.now();
    const endAtTs = startTs ?? now;

    const usersQ = query(
      ref(rtdb, "users"),
      orderByChild("updatedAt"),
      endAt(endAtTs),
      // We want the *last* PAGE_SIZE by updatedAt up to endAtTs
      // limitToLast is better for "latest first"
      // (We’ll reverse when rendering if needed.)
      limitToFirst(PAGE_SIZE) // Alternative: use limitToLast if you want newest-first slice
      // NOTE: If you use limitToLast here, you don’t get older pages easily.
    );

    // We’ll use child listeners for incremental updates
    const added = [];

    onChildAdded(usersQ, (snap) => {
      if (!snap.exists()) return;
      const id = snap.key;
      const val = snap.val();
      added.push(id);
      setUsers((prev) => ({ ...prev, [id]: val }));
    });

    onChildChanged(usersQ, (snap) => {
      if (!snap.exists()) return;
      const id = snap.key;
      const val = snap.val();
      setUsers((prev) => ({ ...prev, [id]: val }));
    });

    onChildRemoved(usersQ, (snap) => {
      const id = snap.key;
      setUsers((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    });

    liveRef.current = ref(rtdb, "users"); // keep a handle to turn off later
    setIsLoading(false);
  }, [rtdb]);

  useEffect(() => {
    attachLiveWindow(null);
    return () => {
      if (liveRef.current) off(liveRef.current);
    };
  }, [attachLiveWindow]);

  const loadMore = useCallback(() => {
    // Compute the next cursor from the *oldest* item we currently have
    const entries = Object.entries(users)
      .map(([id, t]) => ({ id, ...t }))
      .sort((a, b) => a.updatedAt - b.updatedAt); // ascending
    if (entries.length === 0) return;
    const oldest = entries[0].updatedAt;
    setCursor(oldest - 1);
    attachLiveWindow(oldest - 1);
  }, [users, attachLiveWindow]);

  const onCreate = async (e) => {
    e.preventDefault();
    await createUser({ name, zip });
    setName(""); setZip("");
  };
 

  const list = Object.entries(users).map(([id, user]) => ({id, ...user}))
 
  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>User Directory (Realtime)</h1>
      <form onSubmit={onCreate} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="ZIP" value={zip} onChange={e => setZip(e.target.value)} required />
        <button type="submit">Create</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {list.map(u => (
          <li key={u.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <strong>{u.name}</strong> — ZIP {u.zip}
            <div>lat/lon: {u.lat}, {u.lon}</div>
            <div>timezone: {u.timezone} ({u.tzOffsetSec >= 0 ? "+" : ""}{Math.round(u.tzOffsetSec/3600)}h)</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => {
                const newName = prompt("New name", u.name);
                if (newName) updateUser(u.id, { name: newName });
              }}>Rename</button>
              <button onClick={() => {
                const newZip = prompt("New ZIP", u.zip);
                if (newZip && newZip !== u.zip) updateUser(u.id, { zip: newZip });
              }}>Change ZIP</button>
              <button onClick={() => deleteUser(u.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <button disabled={isLoading} onClick={loadMore} className="mt-3">
        {isLoading ? "Loading..." : "Load older"}
      </button>
    </div>
  )
}

export default App
