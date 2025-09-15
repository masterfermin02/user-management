import { useEffect, useState } from 'react'
import './App.css'
import { subscribeUsers } from "./firebase";
import { createUser, updateUser, deleteUser } from "./api";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");

  useEffect(() => {
    const unsub = subscribeUsers(setUsers);
    return () => unsub();
  }, [users]);

  const onCreate = async (e) => {
    e.preventDefault();
    await createUser({ name, zip });
    setName(""); setZip("");
  };

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>User Directory (Realtime)</h1>
      <form onSubmit={onCreate} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="ZIP" value={zip} onChange={e => setZip(e.target.value)} required />
        <button type="submit">Create</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {users.map(u => (
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
    </div>
  )
}

export default App
