const fs = require('fs');
const path = require('path');
const { STORAGE_CONFIG, ensureUploadDirs } = require('../config/storage');
const { BadRequestError } = require('../utils/errors');

class StorageService {
  constructor() {
    ensureUploadDirs();
  }

  async saveFile(file, subfolder = '') {
    try {
      if (!file) {
        throw new BadRequestError('No file provided');
      }

      // For multer uploaded files, file.path is already absolute path
      // Check if file is already in correct subdirectory
      const filePath = file.path;
      const relativePath = filePath.replace(STORAGE_CONFIG.basePath, '').replace(/\\/g, '/');
      
      // Ensure the path starts with forward slash for URL
      const cleanPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;

      return {
        path: filePath,
        url: `/uploads${cleanPath}`,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error('❌ Failed to save file:', error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      if (!filePath) {
        return;
      }

      const actualPath = filePath.startsWith('/uploads')
        ? path.join(STORAGE_CONFIG.basePath, filePath.replace('/uploads', ''))
        : filePath;

      if (fs.existsSync(actualPath)) {
        fs.unlinkSync(actualPath);
        console.log('🗑️ Deleted file:', actualPath);
        return { success: true };
      }

      return { success: false, message: 'File not found' };
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      // Don't throw - file deletion is not critical
      return { success: false, error: error.message };
    }
  }

  async getFileInfo(filePath) {
    try {
      const actualPath = filePath.startsWith('/uploads')
        ? path.join(STORAGE_CONFIG.basePath, filePath.replace('/uploads', ''))
        : filePath;

      if (!fs.existsSync(actualPath)) {
        throw new BadRequestError('File not found');
      }

      const stats = fs.statSync(actualPath);

      return {
        path: actualPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      throw new BadRequestError(`Failed to get file info: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    const actualPath = filePath.startsWith('/uploads')
      ? path.join(STORAGE_CONFIG.basePath, filePath.replace('/uploads', ''))
      : filePath;

    return fs.existsSync(actualPath);
  }

  async getStorageStats() {
    try {
      const avatarsDir = path.join(STORAGE_CONFIG.basePath, 'avatars');
      const questionsDir = path.join(STORAGE_CONFIG.basePath, 'questions');
      const answersDir = path.join(STORAGE_CONFIG.basePath, 'answers');

      const getDirSize = (dir) => {
        if (!fs.existsSync(dir)) {
          return 0;
        }

        let size = 0;
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          if (stats.isFile()) {
            size += stats.size;
          }
        });

        return size;
      };

      return {
        avatars: getDirSize(avatarsDir),
        questions: getDirSize(questionsDir),
        answers: getDirSize(answersDir),
        total: getDirSize(STORAGE_CONFIG.basePath),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  async cleanupOldFiles(daysOld = 30) {
    try {
      const now = Date.now();
      const cutoffTime = now - daysOld * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      const cleanDir = (dir) => {
        if (!fs.existsSync(dir)) {
          return;
        }

        const files = fs.readdirSync(dir);

        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        });
      };

      cleanDir(path.join(STORAGE_CONFIG.basePath, 'temp'));

      console.log(`🗑️ Cleaned up ${deletedCount} old files`);

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new StorageService();
