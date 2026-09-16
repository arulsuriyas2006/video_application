const http = require('http');

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json, cookies });
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runPhase9Tests() {
  console.log('========================================================');
  console.log('🎥 PHASE 9 TEST SUITE: Version Management & Video Comparison');
  console.log('========================================================\n');

  try {
    // 1. Authenticate as Admin
    console.log('1. Authenticating as Admin...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@videoflow.local', password: 'AdminPass123!' }
    );

    if (loginRes.status !== 200 || !loginRes.cookies) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    const cookieHeader = loginRes.cookies.map((c) => c.split(';')[0]).join('; ');
    console.log('   ✅ Authenticated successfully.\n');

    // 2. Fetch Projects
    console.log('2. Fetching Projects to find seeded project with multiple cuts...');
    const projectsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/projects',
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    const nikeProject = projectsRes.data.data.find((p) =>
      p.name.toLowerCase().includes('nike')
    ) || projectsRes.data.data[0];

    if (!nikeProject) {
      throw new Error('No project found in database.');
    }
    console.log(`   Found project: "${nikeProject.name}" (ID: ${nikeProject._id})`);

    // 3. Fetch Versions for this Project
    console.log('3. Fetching Video Versions for project...');
    const versionsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${nikeProject._id}/versions`,
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    const versions = versionsRes.data.data;
    console.log(`   Found ${versions.length} version(s):`, versions.map((v) => `v${v.versionNumber} (${v.title})`));

    if (versions.length < 2) {
      throw new Error(`Project needs at least 2 versions to test comparison. Found: ${versions.length}`);
    }

    const v1 = versions.find((v) => v.versionNumber === 1) || versions[0];
    const v2 = versions.find((v) => v.versionNumber === 2) || versions[1];

    // 4. Test Missing Parameters Validation
    console.log('\n4. Testing Comparison Validation (Missing parameters)...');
    const invalidCompareRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${nikeProject._id}/compare?v1=${v1._id}`,
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    if (invalidCompareRes.status === 400) {
      console.log('   ✅ Received 400 Bad Request as expected when v2 is missing.');
    } else {
      throw new Error(`Expected 400 for missing param, got: ${invalidCompareRes.status}`);
    }

    // 5. Test Comparison Endpoint with valid cuts
    console.log('\n5. Testing GET /api/projects/:projectId/compare?v1=...&v2=...');
    const compareRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${nikeProject._id}/compare?v1=${v1._id}&v2=${v2._id}`,
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    if (compareRes.status !== 200 || !compareRes.data.success) {
      throw new Error(`Compare failed with status ${compareRes.status}: ${JSON.stringify(compareRes.data)}`);
    }

    const { project, v1: resV1, v2: resV2, diffStats, v1Comments, v2Comments } = compareRes.data.data;

    console.log('   ✅ Comparison response received successfully!');
    console.log(`   - Project: "${project.name}"`);
    console.log(`   - V1: "${resV1.title}" (v${resV1.versionNumber}) | Duration: ${resV1.duration}s | Comments: ${resV1.commentsCount}`);
    console.log(`   - V2: "${resV2.title}" (v${resV2.versionNumber}) | Duration: ${resV2.duration}s | Comments: ${resV2.commentsCount}`);
    console.log('   - Diff Stats:');
    console.log(`     * Duration Delta: ${diffStats.durationDeltaSeconds}s`);
    console.log(`     * File Size Delta: ${diffStats.fileSizeDeltaBytes} bytes`);
    console.log(`     * Resolution Changed: ${diffStats.resolutionChanged}`);
    console.log(`     * V1 Comments: ${diffStats.v1TotalComments} (${diffStats.v1ResolvedComments} resolved)`);
    console.log(`     * V2 Comments: ${diffStats.v2TotalComments} (${diffStats.v2ResolvedComments} resolved)`);

    // Basic assertions
    if (!diffStats || typeof diffStats.durationDeltaSeconds !== 'number') {
      throw new Error('Diff stats missing or invalid durationDeltaSeconds');
    }
    if (!Array.isArray(v1Comments) || !Array.isArray(v2Comments)) {
      throw new Error('Comments arrays missing in response');
    }

    console.log('\n🎉 ALL PHASE 9 BACKEND API TESTS PASSED!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 9 TEST FAILED:', err.message);
    process.exit(1);
  }
}

runPhase9Tests();
