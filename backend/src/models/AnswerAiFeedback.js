const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Model AnswerAiFeedback - Phản hồi chấm điểm của AI cho từng bài làm
 * Lưu trữ điểm số, nhận xét, đề xuất cải thiện cho từng câu trả lời
 */
const AnswerAiFeedback = sequelize.define(
  'AnswerAiFeedback',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    answer_id: {
      // ID của câu trả lời cần chấm điểm
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'attempt_answers',
        key: 'id',
      },
    },
    score: {
      // Điểm số AI đã cho cho câu trả lời này
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    comment: {
      // Nhận xét chung của AI về câu trả lời
      type: DataTypes.TEXT,
      allowNull: true,
    },
    suggestions: {
      // Đề xuất cải thiện từ AI (stored as JSON array)
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    cefr_level: {
      // Mức độ CEFR mà AI đánh giá cho câu trả lời (supports detailed levels like A1.1, A1.2, above A1, etc.)
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: 'answer_ai_feedbacks',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false, // Only createdAt
  },
);

module.exports = AnswerAiFeedback;
