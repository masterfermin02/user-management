
type Res = { ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> };

let nextResponse: Res | null = null;

export const __setNextFetchResponse = (res: Res) => {
  nextResponse = res;
};

export const fetch = async (_url: string): Promise<Res> => {
  if (!nextResponse) {
    throw new Error('No mock fetch response set');
  }
  const res = nextResponse;
  nextResponse = null;
  return res;
};
