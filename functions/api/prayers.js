// 소원 카운터 API — Cloudflare Pages Functions + KV
//
//   GET  /api/prayers            → { counts: [n,n,n,n], total: n }
//   POST /api/prayers  {index:0} → 해당 소원 +1 후 같은 형태로 응답
//
// KV 네임스페이스를 대시보드에서 변수명 PRAYERS 로 바인딩해야 동작한다.
// 바인딩이 없으면 500 대신 0 으로 응답한다 — 카운터 하나 때문에
// 메타버스가 깨지지는 않게 한다.

const SLOTS = 4; // 소원 종류 수 (client/src/main.js 의 PRAYERS 와 같아야 함)
const KEY = (i) => `prayer:${i}`;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  // 임베드(iframe)와 같은 오리진이지만, 로컬 개발에서 5173 으로 열어도
  // 읽기는 되도록 열어둔다. 쓰기는 아래에서 오리진을 확인한다.
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
};

async function readCounts(kv) {
  if (!kv) return new Array(SLOTS).fill(0);
  const raw = await Promise.all(
    Array.from({ length: SLOTS }, (_, i) => kv.get(KEY(i)))
  );
  return raw.map((v) => {
    const n = parseInt(v || "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
}

function respond(counts) {
  return new Response(
    JSON.stringify({ counts, total: counts.reduce((a, b) => a + b, 0) }),
    { headers: JSON_HEADERS }
  );
}

export async function onRequestGet({ env }) {
  return respond(await readCounts(env.PRAYERS));
}

export async function onRequestPost({ request, env }) {
  const kv = env.PRAYERS;
  if (!kv) return respond(new Array(SLOTS).fill(0));

  let index;
  try {
    ({ index } = await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }
  if (!Number.isInteger(index) || index < 0 || index >= SLOTS) {
    return new Response(JSON.stringify({ error: "bad index" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  // 읽고-더하고-쓰기. KV 는 트랜잭션이 없어 동시 요청이 겹치면 증가분이
  // 하나로 합쳐질 수 있다. 포트폴리오 트래픽에서는 사실상 문제가 안 되고,
  // 정확한 카운터가 필요해지면 Durable Object 로 옮기면 된다.
  const cur = parseInt((await kv.get(KEY(index))) || "0", 10);
  const next = (Number.isFinite(cur) && cur > 0 ? cur : 0) + 1;
  await kv.put(KEY(index), String(next));

  const counts = await readCounts(kv);
  counts[index] = next; // KV 는 최종 일관성이라 방금 쓴 값이 안 읽힐 수 있다
  return respond(counts);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      ...JSON_HEADERS,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}
