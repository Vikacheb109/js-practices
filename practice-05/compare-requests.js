
import { createApiClient } from "./src/api-client.js";

const client = createApiClient({
  baseUrl: "http://127.0.0.1:5505/api",
  timeoutMs: 2000
});

async function sequential() {
  const started = performance.now();

  await client.requestJson("/debug/delay", {
    query: { ms: 150 }
  });

  await client.requestJson("/debug/delay", {
    query: { ms: 150 }
  });

  return performance.now() - started;
}

async function parallel() {
  const started = performance.now();

  await Promise.all([
    client.requestJson("/debug/delay", {
      query: { ms: 150 }
    }),

    client.requestJson("/debug/delay", {
      query: { ms: 150 }
    })
  ]);

  return performance.now() - started;
}

for (let i = 1; i <= 3; i++) {
  const time = await sequential();
  console.log(
    `Последовательно ${i}: ${time.toFixed(1)} мс`
  );
}

for (let i = 1; i <= 3; i++) {
  const time = await parallel();
  console.log(
    `Параллельно ${i}: ${time.toFixed(1)} мс`
  );
}
