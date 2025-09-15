type User = Record<string, any>;

const store: Record<string, any> = {
  users: {} as Record<string, User>,
};

function pathToNode(path: string) {
  // very simple: "users/abc" => store.users['abc']
  const parts = path.split('/').filter(Boolean);
  let node: any = store;
  for (const p of parts) {
    if (!(p in node)) node[p] = {};
    node = node[p];
  }
  return node;
}

let pushKeyCounter = 0;
function genKey() {
  pushKeyCounter += 1;
  return `key_${pushKeyCounter.toString().padStart(4, '0')}`;
}

export const database = () => ({
  ref: (path?: string) => {
    const basePath = path ?? '/';
    return {
      push: () => {
        const key = genKey();
        const ref = database().ref(`${basePath}/${key}`);
        (ref as any).key = key;
        return ref as any;
      },
      key: undefined as string | undefined,
      async get() {
        const node = pathToNode(basePath);
        return {
          exists: () => {
            // If path points to single user like users/{id},
            // node should be an object with fields including "id"
            if (basePath === 'users') return Object.keys(node).length > 0;
            return node && Object.keys(node).length > 0;
          },
          val: () => node
        };
      },
      async set(value: any) {
        // write object at path
        const parts = basePath.split('/').filter(Boolean);
        if (parts.length === 0) {
          Object.assign(store, value);
          return;
        }
        if (parts.length === 1) {
          (store as any)[parts[0]] = value;
          return;
        }
        const parentPath = parts.slice(0, -1).join('/');
        const leaf = parts[parts.length - 1];
        const parentNode = pathToNode(parentPath);
        parentNode[leaf] = value;
      },
      async remove() {
        const parts = basePath.split('/').filter(Boolean);
        if (parts.length === 0) return;
        const parentPath = parts.slice(0, -1).join('/');
        const leaf = parts[parts.length - 1];
        const parentNode = pathToNode(parentPath);
        delete parentNode[leaf];
      }
    };
  }
}) as any;

export const initializeApp = jest.fn(() => ({}));
export const credential = { applicationDefault: jest.fn() };
export default { initializeApp, credential, database };
