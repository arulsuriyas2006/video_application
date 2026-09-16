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

async function runPhase11Tests() {
  console.log('========================================================');
  console.log('🔒 PHASE 11 TEST SUITE: Secure Client Review Links & Approvals');
  console.log('========================================================\n');

  try {
    // 1. Authenticate as Admin
    console.log('1. Authenticating Admin via HTTP to find video cut...');
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
    console.log('   ✅ Authenticated successfully.');

    // 2. Fetch Projects & Videos
    const projectsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/projects',
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    const project = projectsRes.data.data.find((p) =>
      p.name.toLowerCase().includes('nike')
    ) || projectsRes.data.data[0];

    const versionsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${project._id}/versions`,
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    const video = versionsRes.data.data[0];
    console.log(`   Selected Video: "${video.title}" (ID: ${video._id})\n`);

    // 3. Create Passcode-Protected Review Link
    console.log('2. Generating Passcode-Protected Client Review Link...');
    const createLinkRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/review-links/videos/${video._id}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
      },
      {
        title: 'Nike Summer Campaign Client Sign-Off',
        allowComments: true,
        allowDownload: true,
        requirePasscode: true,
        passcode: 'ClientPass2026!',
        expiresInDays: 7,
      }
    );

    if (createLinkRes.status !== 201) {
      throw new Error(`Create review link failed: ${createLinkRes.status}: ${JSON.stringify(createLinkRes.data)}`);
    }

    const reviewLink = createLinkRes.data.data;
    const token = reviewLink.token;
    console.log(`   ✅ Review Link Created: ${reviewLink.shareUrl}`);
    console.log(`      Token: ${token}`);
    console.log(`      Requires Passcode: ${reviewLink.requirePasscode}\n`);

    // 4. Test Public Session (Locked)
    console.log('3. Fetching Public Session without passcode...');
    const publicLockedRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/review-links/public/${token}`,
      method: 'GET',
    });

    if (publicLockedRes.status !== 200 || !publicLockedRes.data.data.requiresPasscode) {
      throw new Error(`Expected requiresPasscode: true, got: ${JSON.stringify(publicLockedRes.data)}`);
    }
    console.log('   ✅ Received locked status: requiresPasscode is TRUE as expected.');

    // 5. Test Invalid Passcode
    console.log('\n4. Verifying invalid passcode rejection...');
    const invalidPassRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/review-links/public/${token}/verify`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { passcode: 'WrongPassword' }
    );

    if (invalidPassRes.status === 401) {
      console.log('   ✅ 401 Unauthorized received for invalid passcode.');
    } else {
      throw new Error(`Expected 401 for wrong passcode, got: ${invalidPassRes.status}`);
    }

    // 6. Test Correct Passcode
    console.log('\n5. Verifying correct passcode ("ClientPass2026!")...');
    const validPassRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/review-links/public/${token}/verify`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { passcode: 'ClientPass2026!' }
    );

    if (validPassRes.status !== 200 || !validPassRes.data.passcodeToken) {
      throw new Error(`Passcode verification failed: ${JSON.stringify(validPassRes.data)}`);
    }
    const passcodeToken = validPassRes.data.passcodeToken;
    console.log('   ✅ Passcode verified! Received session passcodeToken.');

    // 7. Fetch Unlocked Public Session
    console.log('\n6. Fetching Unlocked Public Review Session with session token...');
    const publicUnlockedRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/review-links/public/${token}`,
      method: 'GET',
      headers: {
        'x-review-passcode-token': passcodeToken,
      },
    });

    if (publicUnlockedRes.status !== 200 || publicUnlockedRes.data.data.requiresPasscode) {
      throw new Error(`Expected unlocked session, got: ${JSON.stringify(publicUnlockedRes.data)}`);
    }

    const sessionData = publicUnlockedRes.data.data;
    console.log('   ✅ Unlocked session loaded successfully:');
    console.log(`      Video Title: "${sessionData.video.title}"`);
    console.log(`      Video File: ${sessionData.video.filePath}`);
    console.log(`      Approval Status: ${sessionData.link.approvalStatus}`);
    console.log(`      Allow Download: ${sessionData.link.allowDownload}`);

    // 8. Post Guest Feedback Comment
    console.log('\n7. Submitting guest feedback comment from client reviewer...');
    const guestCommentRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/review-links/public/${token}/comments`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        timestamp: 5.4,
        message: 'The color saturation on this cut is spot on!',
        authorName: 'David (Client Director)',
      }
    );

    if (guestCommentRes.status !== 201 || !guestCommentRes.data.data.isGuest) {
      throw new Error(`Guest comment creation failed: ${JSON.stringify(guestCommentRes.data)}`);
    }
    const guestComment = guestCommentRes.data.data;
    console.log(`   ✅ Guest feedback posted: "${guestComment.message}" by ${guestComment.authorName} (isGuest: ${guestComment.isGuest})`);

    // 9. Submit Formal Client Cut Approval
    console.log('\n8. Submitting formal client cut sign-off (APPROVE)...');
    const decisionRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/review-links/public/${token}/decision`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        decision: 'APPROVE',
        reviewerName: 'David (Client Director)',
        reviewerEmail: 'david@clientbrand.com',
        notes: 'Final sound design and color grade approved for television release.',
      }
    );

    if (decisionRes.status !== 200 || decisionRes.data.data.approvalStatus !== 'APPROVED') {
      throw new Error(`Submit decision failed: ${JSON.stringify(decisionRes.data)}`);
    }
    console.log('   ✅ Sign-off submitted successfully!');
    console.log(`      Status: ${decisionRes.data.data.approvalStatus}`);
    console.log(`      Video Status in DB: ${decisionRes.data.data.videoStatus}`);

    // Verify video status in database via internal API
    const updatedVideoRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/videos/${video._id}`,
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    if (updatedVideoRes.data.data.status !== 'APPROVED') {
      throw new Error(`Video status should be APPROVED, got: ${updatedVideoRes.data.data.status}`);
    }
    console.log('   ✅ Confirmed Video status in DB is now "APPROVED"!');

    // 10. Test Link Revocation
    console.log('\n9. Testing link revocation...');
    const revokeRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/review-links/${reviewLink._id}`,
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });

    if (revokeRes.status !== 200) {
      throw new Error(`Revocation failed: ${revokeRes.status}`);
    }

    const revokedAccessRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/review-links/public/${token}`,
      method: 'GET',
    });

    if (revokedAccessRes.status === 404) {
      console.log('   ✅ Revoked link returned 404 as expected.');
    } else {
      throw new Error(`Expected 404 for revoked link, got: ${revokedAccessRes.status}`);
    }

    // Clean up test comment
    await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/comments/${guestComment._id}`,
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });

    console.log('\n🎉 ALL PHASE 11 CLIENT REVIEW & APPROVAL TESTS PASSED!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 11 TEST FAILED:', err.message);
    process.exit(1);
  }
}

runPhase11Tests();
