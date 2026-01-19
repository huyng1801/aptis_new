const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Model Question - Câu hỏi
 * Lưu trữ nội dung câu hỏi, loại câu hỏi, mức độ khó, và các tệp media liên quan
 */
const Question = sequelize.define(
  'Question',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question_type_id: {
      // ID loại câu hỏi (MCQ, Essay, Matching, Fill Blanks...)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'question_types',
        key: 'id',
      },
    },
    aptis_type_id: {
      // Loại kỳ thi APTIS này câu hỏi thuộc về
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'aptis_types',
        key: 'id',
      },
    },
    difficulty: {
      // Mức độ khó: easy (dễ), medium (trung bình), hard (khó)
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false,
    },
    content: {
      // Nội dung câu hỏi (văn bản)
      type: DataTypes.TEXT,
      allowNull: false,
    },
    media_url: {
      // URL của file audio/hình ảnh chính
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    additional_media: {
      // Các file media bổ sung (JSON array chứa {type, url, description})
      type: DataTypes.JSON,
      allowNull: true,
    },
    duration_seconds: {
      // Thời gian âm thanh (tính bằng giây) cho câu hỏi nghe
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    parent_question_id: {
      // ID của câu hỏi chính (cho các câu hỏi liên quan trong cùng section)
      // VD: SPEAKING_DESCRIPTION Q1 là primary, Q2-Q3 là follow-up liên quan
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'questions',
        key: 'id',
      },
    },
    created_by: {
      // ID của admin/teacher người tạo câu hỏi
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      // Trạng thái: draft (nháp), active (hoạt động), inactive (không hoạt động)
      type: DataTypes.ENUM('draft', 'active', 'inactive'),
      defaultValue: 'draft',
    },
  },
  {
    tableName: 'questions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

module.exports = Question;
