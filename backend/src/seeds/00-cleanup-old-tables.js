require('dotenv').config();
const { sequelize } = require('../config/database');

/**
 * Cleanup old tables that are no longer used
 * This script handles dropping tables with orphaned foreign key constraints
 */
async function cleanupOldTables() {
  try {
    console.log('[Cleanup] Đang dọn dẹp các bảng cũ...');
    
    // Disable foreign key constraints temporarily to allow dropping tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('[Cleanup] Đã tắt kiểm tra Foreign Key');
    
    // Drop the orphaned table
    await sequelize.query('DROP TABLE IF EXISTS `question_sample_answers`');
    console.log('[Cleanup] Đã xóa bảng question_sample_answers');
    
    // Re-enable foreign key constraints
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[Cleanup] Đã bật lại kiểm tra Foreign Key');
    
    console.log('[Cleanup] Dọn dẹp hoàn thành');
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup] Lỗi khi dọn dẹp:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupOldTables();
}

module.exports = cleanupOldTables;
