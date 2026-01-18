'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tạo backup của dữ liệu cũ trước khi xóa các cột
    await queryInterface.addColumn('answer_ai_feedback', 'legacy_data', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Backup của strengths và weaknesses cũ'
    });

    // Copy dữ liệu strengths và weaknesses vào legacy_data
    await queryInterface.sequelize.query(`
      UPDATE answer_ai_feedback 
      SET legacy_data = JSON_OBJECT(
        'strengths', strengths,
        'weaknesses', weaknesses
      )
      WHERE strengths IS NOT NULL OR weaknesses IS NOT NULL;
    `);

    // Xóa các cột strengths và weaknesses
    await queryInterface.removeColumn('answer_ai_feedback', 'strengths');
    await queryInterface.removeColumn('answer_ai_feedback', 'weaknesses');
  },

  down: async (queryInterface, Sequelize) => {
    // Khôi phục các cột strengths và weaknesses
    await queryInterface.addColumn('answer_ai_feedback', 'strengths', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('answer_ai_feedback', 'weaknesses', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Khôi phục dữ liệu từ legacy_data
    await queryInterface.sequelize.query(`
      UPDATE answer_ai_feedback 
      SET 
        strengths = JSON_UNQUOTE(JSON_EXTRACT(legacy_data, '$.strengths')),
        weaknesses = JSON_UNQUOTE(JSON_EXTRACT(legacy_data, '$.weaknesses'))
      WHERE legacy_data IS NOT NULL;
    `);

    // Xóa cột legacy_data
    await queryInterface.removeColumn('answer_ai_feedback', 'legacy_data');
  }
};