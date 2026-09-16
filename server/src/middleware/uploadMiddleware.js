const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Video storage setup
const videoDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();

  const isMimeVideo = file.mimetype.startsWith('video/');
  const isAllowedExt = allowedExtensions.includes(ext);

  if (isMimeVideo || isAllowedExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported video format. Allowed formats: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max file size
  },
});

// 2. Audio voice notes storage setup
const audioDir = path.join(__dirname, '../../uploads/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webm';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const audioFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.webm', '.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const ext = path.extname(file.originalname).toLowerCase();

  const isAudioMime =
    file.mimetype.startsWith('audio/') ||
    file.mimetype === 'video/webm' || // Some browsers record audio in webm container
    file.mimetype === 'application/octet-stream';

  const isAllowedExt = !ext || allowedExtensions.includes(ext);

  if (isAudioMime || isAllowedExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported audio format. Allowed formats: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max audio size
  },
});

module.exports = {
  uploadVideo,
  uploadAudio,
};
