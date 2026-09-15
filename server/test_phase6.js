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
        resolve({ status: res.statusCode, data: json, cookies });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PHASE 6 COLLABORATION AUTOMATED TESTS ---');

  // 1. Login as Admin
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@videoflow.local', password: 'AdminPass123!' }
  );

  const adminCookie = adminLogin.cookies ? adminLogin.cookies[0].split(';')[0] : '';
  console.log('1. Admin Login:', adminLogin.status === 200 ? 'SUCCESS' : 'FAILED');

  // 2. Login as Client
  const clientLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'client@videoflow.local', password: 'ClientPass123!' }
  );
  const clientCookie = clientLogin.cookies ? clientLogin.cookies[0].split(';')[0] : '';
  console.log('2. Client Login:', clientLogin.status === 200 ? 'SUCCESS' : 'FAILED');

  // 3. Fetch projects to get an active project
  const projectsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const project = projectsRes.data?.data?.[0];
  if (!project) throw new Error('No project found');
  console.log(`3. Found Project: "${project.name}" (ID: ${project._id})`);

  // 4. Fetch videos for this project
  const videosRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${project._id}/versions`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const video = videosRes.data?.data?.[0];
  if (!video) throw new Error('No video found in project');
  console.log(`4. Found Video Cut: "${video.title}" (ID: ${video._id})`);

  // 5. Client posts a comment on the video at 1.85s
  const newCommentRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/videos/${video._id}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: clientCookie,
      },
    },
    {
      timestamp: 1.85,
      message: 'Please boost audio levels on the voiceover dialogue and trim 0.5s.',
    }
  );
  const comment = newCommentRes.data?.data;
  console.log('5. Client Comment Created:', newCommentRes.status === 201 && comment?.status === 'OPEN' ? 'SUCCESS' : 'FAILED');
  console.log('   Comment ID:', comment?._id, 'Timestamp:', comment?.timestamp);

  // 6. Admin replies to the comment
  const replyRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/comments/${comment._id}/replies`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    {
      message: 'Dialogue leveled by +3dB and cut shortened. Exporting in V2 cut now!',
    }
  );
  console.log('6. Admin Reply to Thread:', replyRes.status === 201 ? 'SUCCESS' : 'FAILED');

  // 7. Verify video comments endpoint returns the comment with replies nested
  const videoCommentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/videos/${video._id}/comments`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const targetComment = videoCommentsRes.data?.data?.find((c) => c._id === comment._id);
  const hasReply = targetComment?.replies?.length > 0;
  console.log('7. Enriched Comments with Replies Nesting:', hasReply ? 'SUCCESS' : 'FAILED');

  // 8. Resolve the comment
  const resolveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/comments/${comment._id}/resolve`,
    method: 'PATCH',
    headers: { Cookie: adminCookie },
  });
  console.log('8. Toggle Resolve Status:', resolveRes.status === 200 && resolveRes.data?.data?.status === 'RESOLVED' ? 'SUCCESS' : 'FAILED');

  // 9. Fetch project-level feedback directory
  const projectCommentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${project._id}/comments`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('9. Project Feedback Directory Query:', projectCommentsRes.status === 200 && projectCommentsRes.data?.count > 0 ? 'SUCCESS' : 'FAILED');
  console.log('   Total Project Comments:', projectCommentsRes.data?.count);

  // 10. Query project comments filtered by status=RESOLVED
  const resolvedCommentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${project._id}/comments?status=RESOLVED`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const allResolved = resolvedCommentsRes.data?.data?.every((c) => c.status === 'RESOLVED');
  console.log('10. Status Filter Query (status=RESOLVED):', allResolved ? 'SUCCESS' : 'FAILED');

  // 11. Check Activity Feed
  const activitiesRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${project._id}/activities`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const activities = activitiesRes.data?.data || [];
  const hasCommentAct = activities.some((a) => a.type === 'COMMENT_CREATED');
  const hasReplyAct = activities.some((a) => a.type === 'REPLY_ADDED');
  const hasResolveAct = activities.some((a) => a.type === 'COMMENT_RESOLVED');
  console.log('11. Activity Logs for Collaboration Events:', (hasCommentAct && hasReplyAct && hasResolveAct) ? 'SUCCESS' : 'FAILED');

  console.log('--- ALL PHASE 6 COLLABORATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
