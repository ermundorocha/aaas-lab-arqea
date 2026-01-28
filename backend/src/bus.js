import { addStep, setError } from "./jobStore.js";

const handlers = new Map();
const queue = [];
let running = 0;

const CONCURRENCY = Number(process.env.BUS_CONCURRENCY || 1);

export function on(eventName, fn) {
  if (!handlers.has(eventName)) handlers.set(eventName, []);
  handlers.get(eventName).push(fn);
}

export function emit(eventName, payload) {
  queue.push({ eventName, payload });
  // dispara worker sem bloquear
  setImmediate(drain);
}

async function drain() {
  while (running < CONCURRENCY && queue.length > 0) {
    const item = queue.shift();
    running++;
    runItem(item)
      .catch(() => {}) // evita unhandled rejection
      .finally(() => {
        running--;
        setImmediate(drain);
      });
  }
}

async function runItem({ eventName, payload }) {
  const list = handlers.get(eventName) || [];
  const jobId = payload?.jobId;

  if (jobId) addStep(jobId, { level: "info", event: eventName, msg: "event received" });

  try {
    for (const fn of list) {
      await fn(payload);
    }
  } catch (e) {
    if (jobId) setError(jobId, String(e?.message || e));
    throw e;
  }
}
