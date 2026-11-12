async function testTrack(cat) {
  const r = await fetch('http://localhost:8001/api/jobs?role_category=' + cat);
  const d = await r.json();
  console.log(`\nTrack [${cat}] -> Total: ${d.total}`);
  d.jobs?.slice(0, 5).forEach(j => {
    console.log(`   * ${j.title} (${j.role_category}) skills: ${j.skills?.slice(0, 3).join(', ')}`);
  });
}

async function run() {
  await testTrack('frontend');
  await testTrack('backend');
  await testTrack('mobile');
  await testTrack('qa');
  await testTrack('devops');
  await testTrack('ai');
  await testTrack('fullstack');
}

run().catch(console.error);

