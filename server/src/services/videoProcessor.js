const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs');

// Configure local binary paths
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
} else if (ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
} else if (ffprobeInstaller.path) {
  ffmpeg.setFfprobePath(ffprobeInstaller.path);
}

/**
 * Probe video metadata using ffprobe
 * @param {string} filePath - Absolute path to video file
 * @returns {Promise<{duration: number, width: number, height: number, fileSize: number}>}
 */
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.warn(`[FFprobe Warning] Could not probe video: ${err.message}`);
        // Fallback with basic file stats
        try {
          const stats = fs.statSync(filePath);
          return resolve({
            duration: 0,
            width: 1920,
            height: 1080,
            fileSize: stats.size,
          });
        } catch {
          return resolve({ duration: 0, width: 0, height: 0, fileSize: 0 });
        }
      }

      let duration = 0;
      let width = 1920;
      let height = 1080;
      let fileSize = metadata.format?.size || 0;

      if (metadata.format?.duration) {
        duration = parseFloat(metadata.format.duration);
      }

      const videoStream = metadata.streams?.find(
        (s) => s.codec_type === 'video'
      );

      if (videoStream) {
        if (videoStream.width) width = videoStream.width;
        if (videoStream.height) height = videoStream.height;
        if (!duration && videoStream.duration) {
          duration = parseFloat(videoStream.duration);
        }
      }

      resolve({
        duration: Math.round(duration * 100) / 100,
        width,
        height,
        fileSize,
      });
    });
  });
};

/**
 * Generate thumbnail image from video
 * @param {string} videoFilePath - Absolute path to video
 * @param {string} outputDir - Directory to save thumbnail
 * @param {string} filename - Base name without extension
 * @param {number} timestampSec - Timestamp in seconds to take screenshot
 * @returns {Promise<string>} - Relative thumbnail path (/uploads/thumbnails/...)
 */
const generateThumbnail = (
  videoFilePath,
  outputDir,
  filename,
  timestampSec = 1.0
) => {
  return new Promise((resolve) => {
    const thumbFilename = `thumb-${filename}.jpg`;
    const targetFile = path.join(outputDir, thumbFilename);

    ffmpeg(videoFilePath)
      .screenshots({
        timestamps: [timestampSec],
        filename: thumbFilename,
        folder: outputDir,
        size: '640x360',
      })
      .on('end', () => {
        resolve(`/uploads/thumbnails/${thumbFilename}`);
      })
      .on('error', (err) => {
        console.warn(
          `[FFmpeg Warning] Thumbnail generation failed: ${err.message}. Proceeding without thumbnail.`
        );
        resolve('');
      });
  });
};

/**
 * Complete video processing pipeline: probe metadata + generate thumbnail
 * @param {string} videoFilePath - Absolute path to uploaded video
 * @param {string} originalName - Original uploaded filename
 * @returns {Promise<{duration: number, width: number, height: number, fileSize: number, thumbnailPath: string}>}
 */
const processVideo = async (videoFilePath, originalName) => {
  const meta = await getVideoMetadata(videoFilePath);

  const thumbDir = path.join(__dirname, '../../uploads/thumbnails');
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }

  const baseName = path.parse(videoFilePath).name;
  const seekTime = meta.duration > 1.5 ? 1.0 : Math.max(0.1, meta.duration / 2);

  const thumbnailPath = await generateThumbnail(
    videoFilePath,
    thumbDir,
    baseName,
    seekTime
  );

  return {
    duration: meta.duration,
    width: meta.width,
    height: meta.height,
    fileSize: meta.fileSize,
    thumbnailPath,
  };
};

module.exports = {
  getVideoMetadata,
  generateThumbnail,
  processVideo,
};
