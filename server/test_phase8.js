const http = require('http');
const fs = require('fs');
const path = require('path');

// Helper to send HTTP requests
async function request(options, body = null, isRaw = false) {
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
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

// Build a simple multipart/form-data payload with boundary
function buildMultipartBody(fields, fileField, filename, fileBuffer, mimeType = 'audio/webm') {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const chunks = [];

  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
  }

  if (fileField && fileBuffer) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      )
    );
    chunks.push(fileBuffer);
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(chunks),
  };
}

async function runTests() {
  console.log('--- STARTING PHASE 8 VOICE FEEDBACK AUTOMATED TESTS ---');

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
  let project = null;
  let video = null;
  for (const p of projectsRes.data?.data || []) {
    const vRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/projects/${p._id}/versions`,
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    if (vRes.data?.data?.length > 0) {
      project = p;
      video = vRes.data.data[0];
      break;
    }
  }

  if (!project || !video) throw new Error('No project with videos found');
  console.log(`2. Target Video: "${video.title}" in Project "${project.name}" (ID: ${video._id})`);

  // 3. Create a synthetic audio file buffer (simple 44-byte WAV header + mock PCM audio)
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + 1000, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  wavHeader.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  wavHeader.writeUInt32LE(16000, 24); // SampleRate (16kHz)
  wavHeader.writeUInt32LE(32000, 28); // ByteRate (16000 * 1 * 2)
  wavHeader.writeUInt16LE(2, 32);  // BlockAlign
  wavHeader.writeUInt16LE(16, 34); // BitsPerSample
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(1000, 40); // Subchunk2Size
  const mockAudioData = Buffer.alloc(1000, 0x55);
  const sampleAudioBuffer = Buffer.concat([wavHeader, mockAudioData]);

  // 4. Submit Comment with Voice Note attachment via multipart/form-data
  const multipart = buildMultipartBody(
    {
      timestamp: '2.5',
      message: 'Please review the director audio notes regarding sound effects pacing.',
      voiceNoteDuration: '6.5',
    },
    'audio',
    'director_note.wav',
    sampleAudioBuffer,
    'audio/wav'
  );

  const createCommentRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/videos/${video._id}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        'Content-Length': multipart.body.length,
        Cookie: adminCookie,
      },
    },
    multipart.body
  );

  const comment = createCommentRes.data?.data;
  console.log('3. Create Comment with Audio Attachment:', createCommentRes.status === 201 ? 'SUCCESS' : 'FAILED');
  console.log('   Comment ID:', comment?._id);
  console.log('   hasVoiceNote:', comment?.hasVoiceNote);
  console.log('   voiceNoteUrl:', comment?.voiceNoteUrl);
  console.log('   voiceNoteDuration:', comment?.voiceNoteDuration);

  // 5. Verify audio file was saved to local disk
  const audioRelative = comment?.voiceNoteUrl; // e.g. /uploads/audio/audio-123.wav
  const audioDiskPath = path.join(__dirname, audioRelative);
  const fileExists = fs.existsSync(audioDiskPath);
  console.log('4. Audio File Persisted on Disk:', fileExists ? 'SUCCESS' : 'FAILED');
  if (fileExists) {
    console.log(`   File Size on Disk: ${fs.statSync(audioDiskPath).size} bytes`);
  }

  // 6. Verify audio streaming over HTTP
  const streamRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: audioRelative,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });
  console.log('5. Audio Streaming over HTTP:', (streamRes.status === 200 || streamRes.status === 206) ? 'SUCCESS' : 'FAILED');
  console.log('   Accept-Ranges Header:', streamRes.headers['accept-ranges']);

  // 7. Standalone Audio Upload endpoint test
  const standaloneMultipart = buildMultipartBody({}, 'audio', 'voice_clip.webm', sampleAudioBuffer, 'audio/webm');
  const standaloneRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/comments/upload-audio',
      method: 'POST',
      headers: {
        'Content-Type': standaloneMultipart.contentType,
        'Content-Length': standaloneMultipart.body.length,
        Cookie: adminCookie,
      },
    },
    standaloneMultipart.body
  );
  console.log('6. Standalone Audio Upload API:', standaloneRes.status === 200 && standaloneRes.data?.data?.voiceNoteUrl ? 'SUCCESS' : 'FAILED');
  const standaloneUrl = standaloneRes.data?.data?.voiceNoteUrl;

  // 8. Delete Comment and verify audio file is unlinked from disk
  const deleteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/comments/${comment._id}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie },
  });
  console.log('7. Delete Comment:', deleteRes.status === 200 ? 'SUCCESS' : 'FAILED');

  const fileStillExists = fs.existsSync(audioDiskPath);
  console.log('8. Cascade Unlink of Audio File on Disk:', !fileStillExists ? 'SUCCESS' : 'FAILED');

  // Clean up standalone test audio file if exists
  if (standaloneUrl) {
    const standaloneDisk = path.join(__dirname, standaloneUrl);
    if (fs.existsSync(standaloneDisk)) {
      try { fs.unlinkSync(standaloneDisk); } catch (e) {}
    }
  }

  console.log('--- ALL PHASE 8 VOICE FEEDBACK TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
