/** Deterministic pseudo-random number from an integer seed (mulberry32). */
function seededRandom(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getDailyCount(): number {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return 128 + Math.floor(seededRandom(seed) * 320); // 128 – 447
}

const TOP_SYMPTOMS = ['发烧', '咳嗽', '头痛'];

export function StatsBanner() {
  const count = getDailyCount();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white/90 text-xs py-1.5 px-4 flex items-center justify-center gap-1.5 select-none">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse flex-shrink-0" />
      <span>
        今日已有&nbsp;<span className="font-semibold text-white">{count}</span>&nbsp;人完成问诊
      </span>
      <span className="opacity-50 mx-1">·</span>
      <span>
        本周最多上报症状：
        {TOP_SYMPTOMS.map((s, i) => (
          <span key={s}>
            <span className="font-semibold text-white">{s}</span>
            {i < TOP_SYMPTOMS.length - 1 && <span className="opacity-60">、</span>}
          </span>
        ))}
      </span>
    </div>
  );
}
