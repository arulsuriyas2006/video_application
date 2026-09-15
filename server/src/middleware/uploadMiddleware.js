const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Video storage setup
const videoDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

// File filter for common video formats
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
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max file size
  },
});

module.exports = { uploadVideo };
