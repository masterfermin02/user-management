const BASE = import.meta.env.VITE_FUNCTIONS_BASE;

export async function createUser(payload: { name: string; zip: string }) {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(id: string, payload: { name?: string; zip?: string }) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteUser(id: string) {
  const res = await fetch(`${BASE}/users/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}

export async function helloWorld() {
  const res = await fetch(`${BASE}/helloWorld`);
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}