const http = require('http');
const io = require('../client/node_modules/socket.io-client');

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase10Tests() {
  console.log('========================================================');
  console.log('⚡ PHASE 10 TEST SUITE: Real-Time Socket.IO Collaboration');
  console.log('========================================================\n');

  let socketA = null;
  let socketB = null;

  try {
    // 1. Authenticate as Admin to fetch project & video IDs
    console.log('1. Authenticating Admin via HTTP to find active video cut...');
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

    const projectsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/projects',
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    if (!projectsRes.data || !projectsRes.data.data) {
      throw new Error(`Failed to get projects: ${JSON.stringify(projectsRes)}`);
    }

    const project = projectsRes.data.data.find((p) =>
      p.name.toLowerCase().includes('nike')
    ) || projectsRes.data.data[0];

    if (!project) {
      throw new Error('No project found.');
    }
    const versionsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${project._id}/versions`,
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });

    const targetVideo = versionsRes.data.data[0];
    const videoId = targetVideo._id;
    console.log(`   Target Video: "${targetVideo.title}" (ID: ${videoId})\n`);

    // 2. Connect Socket A (Editor) and Socket B (Client)
    console.log('2. Connecting two concurrent WebSocket clients to ws://localhost:5000 ...');
    socketA = io('http://localhost:5000', { transports: ['websocket'] });
    socketB = io('http://localhost:5000', { transports: ['websocket'] });

    await new Promise((resolve, reject) => {
      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 2) resolve();
      };
      socketA.on('connect', onConnect);
      socketB.on('connect', onConnect);
      socketA.on('connect_error', reject);
      socketB.on('connect_error', reject);
      setTimeout(() => reject(new Error('WebSocket connection timed out')), 5000);
    });

    console.log(`   ✅ Socket A connected: ${socketA.id}`);
    console.log(`   ✅ Socket B connected: ${socketB.id}\n`);

    // 3. Socket A joins video room
    console.log('3. Socket A (Editor) joining video review room...');
    const presencePromiseA = new Promise((resolve) => {
      socketA.once('room_presence', (data) => {
        resolve(data);
      });
    });

    socketA.emit('join_video_review', {
      videoId,
      user: { id: 'user_editor_1', name: 'Sarah Editor', role: 'EDITOR' },
    });

    const presenceData1 = await presencePromiseA;
    console.log(`   ✅ Socket A received room_presence: ${presenceData1.users.length} user(s) online`);
    if (presenceData1.users.length < 1) {
      throw new Error('Expected at least 1 user in presence list');
    }

    // 4. Socket B joins video room
    console.log('\n4. Socket B (Client) joining same video review room...');
    const presencePromiseBoth = Promise.all([
      new Promise((resolve) => socketA.once('room_presence', resolve)),
      new Promise((resolve) => socketB.once('room_presence', resolve)),
    ]);

    socketB.emit('join_video_review', {
      videoId,
      user: { id: 'user_client_2', name: 'Mark Client', role: 'CLIENT' },
    });

    const [presenceA, presenceB] = await presencePromiseBoth;
    console.log(`   ✅ Socket A presence updated: ${presenceA.users.length} users online (${presenceA.users.map((u) => u.name).join(', ')})`);
    console.log(`   ✅ Socket B presence updated: ${presenceB.users.length} users online (${presenceB.users.map((u) => u.name).join(', ')})`);

    if (presenceA.users.length !== 2 || presenceB.users.length !== 2) {
      throw new Error(`Expected 2 users in presence list, got ${presenceA.users.length}`);
    }

    // 5. Test Live Drawing Stroke Relay
    console.log('\n5. Testing Live Canvas Drawing Stroke Relay (Socket A -> Socket B)...');
    const drawingPromiseB = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Drawing stroke not received in 5s')), 5000);
      socketB.once('drawing_stroke', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    socketA.emit('drawing_stroke', {
      videoId,
      shape: {
        type: 'arrow',
        color: '#f59e0b',
        startX: 0.2,
        startY: 0.3,
        endX: 0.6,
        endY: 0.7,
      },
    });

    const receivedStroke = await drawingPromiseB;
    console.log(`   ✅ Socket B received real-time drawing stroke:`, receivedStroke.shape.type);

    // 6. Test Live Comment Broadcast over Socket
    console.log('\n6. Testing Live Comment Broadcast (HTTP Post -> Socket Broadcast)...');
    const commentPromiseA = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Comment broadcast timed out on Socket A')), 5000);
      socketA.once('new_comment', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const commentPromiseB = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Comment broadcast timed out on Socket B')), 5000);
      socketB.once('new_comment', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const testCommentRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/videos/${videoId}/comments`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
      },
      {
        timestamp: 4.2,
        message: '⚡ Phase 10 Real-Time Socket Broadcast Test Comment',
      }
    );

    if (testCommentRes.status !== 201) {
      throw new Error(`Creating test comment failed: ${testCommentRes.status}`);
    }
    const createdComment = testCommentRes.data.data;
    console.log(`   HTTP Comment Created (ID: ${createdComment._id})`);

    const [commentDataA, commentDataB] = await Promise.all([commentPromiseA, commentPromiseB]);
    console.log(`   ✅ Socket A received new_comment: "${commentDataA.comment.message}"`);
    console.log(`   ✅ Socket B received new_comment: "${commentDataB.comment.message}"`);

    // 7. Test Graceful Room Leave & Disconnect Presence Update
    console.log('\n7. Testing Disconnect & Presence Cleanup...');
    const leavePresencePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Leave presence timed out')), 5000);
      socketA.once('room_presence', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    socketB.disconnect();

    const remainingPresence = await leavePresencePromise;
    console.log(`   ✅ Socket A received updated presence after Socket B disconnect: ${remainingPresence.users.length} user remaining (${remainingPresence.users[0]?.name})`);

    if (remainingPresence.users.length !== 1) {
      throw new Error(`Expected 1 remaining user, got ${remainingPresence.users.length}`);
    }

    // Clean up created test comment
    await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/comments/${createdComment._id}`,
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });

    socketA.disconnect();

    console.log('\n🎉 ALL PHASE 10 REAL-TIME COLLABORATION TESTS PASSED!\n');
    process.exit(0);
  } catch (err) {
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    console.error('\n❌ PHASE 10 TEST FAILED:', err.message);
    process.exit(1);
  }
}

runPhase10Tests();
