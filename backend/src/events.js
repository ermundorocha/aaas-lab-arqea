const handlers = new Map();

export function on(eventName, fn) {
  if (!handlers.has(eventName)) handlers.set(eventName, []);
  handlers.get(eventName).push(fn);
}

export async function emit(eventName, payload) {
  const list = handlers.get(eventName) || [];
  for (const fn of list) {
    await fn(payload);
  }
}
