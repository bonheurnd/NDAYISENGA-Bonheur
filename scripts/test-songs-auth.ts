import jwt from 'jsonwebtoken';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'lalumiere-choir-adepr-nyanza-kicukiro-secret-key-2026';

console.log('\n======================================================');
console.log('  RUNNING LA LUMIERE SONGS AUTHENTICATION TESTS');
console.log('======================================================');
console.log(`Target Service: ${BASE_URL}\n`);

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runSongAuthTests() {
  // 1. Unauthenticated creation is rejected with 401
  const unauthRes = await fetch(`${BASE_URL}/api/admin/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Indirimbo Nshya Itagira Uburenganzira',
      lyrics: 'Amagambo y\'indirimbo',
    }),
  });
  assert(unauthRes.status === 401, 'Unauthenticated user rejected with 401');
  const unauthData = await unauthRes.json();
  assert(
    unauthData.error?.includes('Ugomba kwinjira') || unauthData.error?.includes('Authentication required'),
    'Returns correct error: Ugomba kwinjira muri konti yawe'
  );

  // 2. Member without admin role rejected with 403 Forbidden
  const memberToken = jwt.sign(
    { id: 'usr_member_default', email: 'member@lalumierechoir.rw', name: 'Worshipper David', role: 'choir_member' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const memberRes = await fetch(`${BASE_URL}/api/admin/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${memberToken}`,
    },
    body: JSON.stringify({
      title: 'Indirimbo y\'umunyamuryango usanzwe',
      lyrics: 'Amagambo y\'indirimbo',
    }),
  });
  assert(memberRes.status === 403, 'Regular member rejected with 403 Forbidden');

  // 3. Admin token succeeds
  const adminToken = jwt.sign(
    { id: 'usr_admin_default', email: 'admin@lalumierechoir.rw', name: 'Choir Administrator', role: 'super_admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testTitle = `UHORAHO NI MWIZA - TEST ${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/admin/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: testTitle,
      song_number: '999',
      composer: 'La Lumiere Choir',
      category_id: 'cat_agakiza',
      status: 'published',
      release_status: 'released',
      description: 'Indirimbo y\'ishimwe yakozwe mu bizamini',
      lyrics: '1. Uhoraho ni mwiza iteka ryose...\n\nR/ Haleluya shimwa Mwami...',
      solfa_notation: 'd : m : s | d : - : -',
      language: 'rw',
    }),
  });

  assert(createRes.status === 201, 'Admin can add song without authentication error (201 Created)');
  const createData = await createRes.json();
  assert(Boolean(createData.songId), 'Returns valid created songId');
  const createdSongId = createData.songId;

  // 4. Persistence verification: Song exists in library
  const getSongRes = await fetch(`${BASE_URL}/api/songs/${createdSongId}`);
  assert(getSongRes.ok, 'Newly created song is retrievable via GET /api/songs/:id');
  const fetchedSong = await getSongRes.json();
  assert(fetchedSong.title === testTitle, 'Persisted song title matches exactly');
  assert(
    typeof fetchedSong.lyrics === 'string' && fetchedSong.lyrics.includes('Uhoraho ni mwiza'),
    'Persisted song lyrics saved'
  );

  // 5. Update song with admin token
  const updateRes = await fetch(`${BASE_URL}/api/admin/songs/${createdSongId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: `${testTitle} (Updated)`,
      song_number: '999',
      category_id: 'cat_agakiza',
      status: 'published',
    }),
  });
  assert(updateRes.ok, 'Admin can update song with Bearer token (200 OK)');

  // 6. Soft delete song with admin token
  const deleteRes = await fetch(`${BASE_URL}/api/admin/songs/${createdSongId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(deleteRes.ok, 'Admin can delete song with Bearer token (200 OK)');

  // 7. Restore song with admin token
  const restoreRes = await fetch(`${BASE_URL}/api/admin/songs/${createdSongId}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(restoreRes.ok, 'Admin can restore song with Bearer token (200 OK)');

  // 8. Permanent cleanup of test fixture
  const permDeleteRes = await fetch(`${BASE_URL}/api/admin/songs/${createdSongId}?permanent=true`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(permDeleteRes.ok, 'Cleaned up test song fixture permanently');

  console.log('\n======================================================');
  console.log(`  ALL ${passedTests} OF ${totalTests} SONGS AUTH TESTS PASSED!`);
  console.log('======================================================\n');
}

runSongAuthTests().catch(err => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
