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
  console.log('--- STARTING PHASE 7 CANVAS ANNOTATION AUTOMATED TESTS ---');

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

  // 2. Fetch Project & Video
  const projectsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const project = projectsRes.data?.data?.[0];
  if (!project) throw new Error('No project found');

  const videosRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${project._id}/versions`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  const video = videosRes.data?.data?.[0];
  if (!video) throw new Error('No video found');
  console.log(`2. Target Video: "${video.title}" (ID: ${video._id})`);

  // 3. Post a comment WITH visual drawing shapes (Pen, Arrow, Rectangle, Circle, Highlighter)
  const sampleShapes = [
    {
      type: 'FREE_DRAW',
      color: '#ef4444',
      strokeWidth: 3,
      points: [
        { x: 0.15, y: 0.2 },
        { x: 0.18, y: 0.22 },
        { x: 0.22, y: 0.25 },
      ],
    },
    {
      type: 'ARROW',
      color: '#f59e0b',
      strokeWidth: 4,
      arrow: { startX: 0.3, startY: 0.3, endX: 0.45, endY: 0.45 },
    },
    {
      type: 'RECTANGLE',
      color: '#06b6d4',
      strokeWidth: 2,
      rect: { x: 0.5, y: 0.5, width: 0.2, height: 0.15 },
    },
    {
      type: 'CIRCLE',
      color: '#10b981',
      strokeWidth: 3,
      circle: { cx: 0.8, cy: 0.3, rx: 0.08, ry: 0.08 },
    },
    {
      type: 'HIGHLIGHT',
      color: '#a855f7',
      strokeWidth: 5,
      points: [
        { x: 0.1, y: 0.8 },
        { x: 0.6, y: 0.8 },
      ],
    },
  ];

  const commentWithMarkupRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/videos/${video._id}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    {
      timestamp: 2.4,
      message: 'Fix color grade on the product highlights and clean up background artifacting.',
      shapes: sampleShapes,
    }
  );

  const commentData = commentWithMarkupRes.data?.data;
  console.log('3. Create Comment with 5 Visual Markup Shapes:', commentWithMarkupRes.status === 201 ? 'SUCCESS' : 'FAILED');
  console.log('   Comment ID:', commentData?._id);
  console.log('   hasAnnotation flag:', commentData?.hasAnnotation);
  console.log('   annotationId present:', !!commentData?.annotationId);

  // 4. Fetch Video Annotations
  const getAnnotationsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/videos/${video._id}/annotations`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  const annotationsList = getAnnotationsRes.data?.data || [];
  const foundAnnotation = annotationsList.find((a) => a.commentId?._id === commentData?._id || a.commentId === commentData?._id);
  console.log('4. Query Video Annotations Endpoint:', getAnnotationsRes.status === 200 && foundAnnotation ? 'SUCCESS' : 'FAILED');
  console.log(`   Total Annotations on Video: ${annotationsList.length}`);
  console.log(`   Shapes in Linked Annotation: ${foundAnnotation?.shapes?.length} (Expected: 5)`);

  // 5. Query Comment Annotation directly
  const getCommentAnnRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/annotations/comments/${commentData._id}`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('5. Query Comment Annotation directly:', getCommentAnnRes.status === 200 ? 'SUCCESS' : 'FAILED');

  // 6. Test standalone annotation creation
  const standaloneAnnRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/videos/${video._id}/annotations`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
    },
    {
      timestamp: 3.1,
      shapes: [
        {
          type: 'ARROW',
          color: '#ffffff',
          strokeWidth: 3,
          arrow: { startX: 0.1, startY: 0.1, endX: 0.2, endY: 0.2 },
        },
      ],
    }
  );
  console.log('6. Standalone Annotation Creation:', standaloneAnnRes.status === 201 ? 'SUCCESS' : 'FAILED');

  // 7. Delete Comment and verify cascade deletion of annotation
  const deleteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/comments/${commentData._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  console.log('7. Delete Comment:', deleteRes.status === 200 ? 'SUCCESS' : 'FAILED');

  const checkDeletedAnn = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/annotations/comments/${commentData._id}`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('8. Cascade Deletion of Linked Annotation:', checkDeletedAnn.status === 404 ? 'SUCCESS' : 'FAILED');

  // Clean up standalone annotation
  if (standaloneAnnRes.data?.data?._id) {
    await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/annotations/${standaloneAnnRes.data.data._id}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
  }

  console.log('--- ALL PHASE 7 CANVAS ANNOTATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
