async function run() {
  for (let page = 1; page <= 4; page++) {
    const r = await fetch(`http://localhost:8001/api/jobs?posted_days=1&page=${page}&limit=24`);
    const d = await r.json();
    console.log(`\n=== PAGE ${page} (Total: ${d.total}) ===`);
    const now = Date.now();
    d.jobs?.forEach((j, i) => {
      const p = j.source_posted_at || j.posted_at || j.createdAt;
      const diffHours = (now - new Date(p).getTime()) / (3600 * 1000);
      const diffDays = diffHours / 24;
      console.log(`${(page-1)*24 + i+1}. [${j.title}] posted_at: ${j.posted_at} | source_posted_at: ${j.source_posted_at} (${diffHours.toFixed(1)}h ago, ${diffDays.toFixed(1)}d ago)`);
    });
  }
}
run().catch(console.error);
