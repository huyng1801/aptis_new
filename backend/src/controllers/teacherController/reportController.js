const {
  ExamAttempt,
  AttemptAnswer,
  Exam,
  User,
  Question,
  QuestionType,
  SkillType,
} = require('../../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../../utils/errors');

/**
 * Get exam statistics
 */
exports.getExamStatistics = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    const attempts = await ExamAttempt.findAll({
      where: { exam_id: examId, status: 'submitted' },
      attributes: ['id', 'total_score', 'student_id', 'start_time', 'end_time'],
    });

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          exam,
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0,
        },
      });
    }

    const scores = attempts.map((a) => parseFloat(a.total_score || 0));
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Pass rate (assuming 60% is passing)
    const passingScore = exam.total_score * 0.6;
    const passed = scores.filter((s) => s >= passingScore).length;
    const passRate = (passed / scores.length) * 100;

    // Score distribution by skill
    const skillScores = {};

    res.json({
      success: true,
      data: {
        exam,
        totalAttempts: attempts.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        passRate: Math.round(passRate * 100) / 100,
        scoreDistribution: {
          excellent: scores.filter((s) => s >= exam.total_score * 0.9).length,
          good: scores.filter((s) => s >= exam.total_score * 0.7 && s < exam.total_score * 0.9)
            .length,
          average: scores.filter((s) => s >= exam.total_score * 0.5 && s < exam.total_score * 0.7)
            .length,
          poor: scores.filter((s) => s < exam.total_score * 0.5).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student statistics
 */
exports.getStudentStatistics = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const students = await User.findAll({
      where: { role: 'student', status: 'active' },
      attributes: ['id', 'full_name', 'email'],
    });

    const statistics = [];

    for (const student of students) {
      const attempts = await ExamAttempt.findAll({
        where: { student_id: student.id, status: 'submitted' },
      });

      const totalAttempts = attempts.length;
      const scores = attempts.map((a) => parseFloat(a.total_score || 0));
      const averageScore =
        scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

      statistics.push({
        student,
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1].start_time : null,
      });
    }

    // Sort by average score descending
    statistics.sort((a, b) => b.averageScore - a.averageScore);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get individual student report
 */
exports.getStudentReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findByPk(studentId);
    if (!student || student.role !== 'student') {
      throw new NotFoundError('Student not found');
    }

    const attempts = await ExamAttempt.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'total_score'],
        },
      ],
      order: [['start_time', 'DESC']],
    });

    const totalAttempts = attempts.length;
    const scores = attempts
      .filter((a) => a.status === 'submitted')
      .map((a) => parseFloat(a.total_score || 0));

    const averageScore =
      scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

    res.json({
      success: true,
      data: {
        student,
        totalAttempts,
        completedAttempts: scores.length,
        averageScore: Math.round(averageScore * 100) / 100,
        attempts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export statistics to Excel
 */
exports.exportStatistics = async (req, res, next) => {
  try {
    const { type, format = 'xlsx', student_id, exam_id } = req.query;
    
    // Import xlsx library
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    if (type === 'student_performance' && student_id) {
      // Export student performance report
      const worksheet = workbook.addWorksheet('Báo cáo học viên');
      
      const student = await User.findByPk(student_id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      
      const attempts = await ExamAttempt.findAll({
        where: { student_id },
        include: [{ model: Exam, as: 'exam', attributes: ['id', 'title', 'total_score'] }],
        order: [['start_time', 'DESC']]
      });
      
      // Add header
      worksheet.columns = [
        { header: 'Bài thi', key: 'exam_title', width: 30 },
        { header: 'Ngày thi', key: 'start_time', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Điểm số', key: 'score', width: 12 },
        { header: 'Thời gian (phút)', key: 'duration', width: 15 }
      ];
      
      // Add student info section
      const infoRow = worksheet.insertRows(1, 1)[0];
      infoRow.values = ['Báo cáo học viên'];
      infoRow.font = { bold: true, size: 14 };
      
      worksheet.insertRows(2, 1);
      worksheet.insertRows(3, 1)[0].values = [`Tên: ${student.full_name}`, `Email: ${student.email}`];
      
      // Add data
      let rowIndex = 5;
      worksheet.insertRows(rowIndex, 1)[0].values = {
        exam_title: 'Bài thi',
        start_time: 'Ngày thi',
        status: 'Trạng thái',
        score: 'Điểm số',
        duration: 'Thời gian'
      };
      worksheet.getRow(rowIndex).font = { bold: true };
      
      rowIndex++;
      attempts.forEach(attempt => {
        worksheet.insertRows(rowIndex, 1)[0].values = {
          exam_title: attempt.exam?.title || 'N/A',
          start_time: new Date(attempt.start_time).toLocaleDateString('vi-VN'),
          status: attempt.status === 'submitted' ? 'Hoàn thành' : 'Chưa hoàn thành',
          score: attempt.status === 'submitted' ? `${attempt.total_score}/${attempt.exam?.total_score}` : 'N/A',
          duration: attempt.duration_minutes || 'N/A'
        };
        rowIndex++;
      });
      
    } else if (type === 'exam_statistics' && exam_id) {
      // Export exam statistics report
      const worksheet = workbook.addWorksheet('Thống kê bài thi');
      
      const exam = await Exam.findByPk(exam_id);
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }
      
      const attempts = await ExamAttempt.findAll({
        where: { exam_id, status: 'submitted' }
      });
      
      const scores = attempts.map(a => parseFloat(a.total_score || 0));
      const averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
      const passRate = scores.length > 0 ? Math.round((scores.filter(s => s >= exam.total_score * 0.5).length / scores.length) * 100) : 0;
      
      worksheet.columns = [
        { header: 'Thực thi', key: 'metric', width: 25 },
        { header: 'Giá trị', key: 'value', width: 15 }
      ];
      
      // Add header
      const headerRow = worksheet.insertRows(1, 1)[0];
      headerRow.values = ['Thống kê bài thi'];
      headerRow.font = { bold: true, size: 14 };
      
      worksheet.insertRows(2, 1);
      worksheet.insertRows(3, 1)[0].values = [`Bài thi: ${exam.title}`];
      
      // Add statistics
      const stats = [
        { metric: 'Tổng lượt thi', value: attempts.length },
        { metric: 'Điểm trung bình', value: Math.round(averageScore * 100) / 100 },
        { metric: 'Điểm cao nhất', value: Math.max(...scores, 0) },
        { metric: 'Điểm thấp nhất', value: Math.min(...scores, 0) },
        { metric: 'Tỷ lệ đậu (%)', value: passRate },
        { metric: 'Xuất sắc (≥90%)', value: scores.filter(s => s >= exam.total_score * 0.9).length },
        { metric: 'Tốt (70-89%)', value: scores.filter(s => s >= exam.total_score * 0.7 && s < exam.total_score * 0.9).length },
        { metric: 'Trung bình (50-69%)', value: scores.filter(s => s >= exam.total_score * 0.5 && s < exam.total_score * 0.7).length },
        { metric: 'Yếu (<50%)', value: scores.filter(s => s < exam.total_score * 0.5).length }
      ];
      
      let rowIndex = 5;
      stats.forEach(stat => {
        worksheet.insertRows(rowIndex, 1)[0].values = stat;
        rowIndex++;
      });
      
    } else {
      // Export all student statistics
      const worksheet = workbook.addWorksheet('Thống kê học sinh');
      
      const students = await User.findAll({
        where: { role: 'student', status: 'active' },
        attributes: ['id', 'full_name', 'email']
      });
      
      worksheet.columns = [
        { header: 'Tên học sinh', key: 'full_name', width: 25 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Tổng lần thi', key: 'totalAttempts', width: 15 },
        { header: 'Điểm TB', key: 'averageScore', width: 12 },
        { header: 'Lần thi cuối', key: 'lastAttempt', width: 18 }
      ];
      
      // Add header
      const headerRow = worksheet.insertRows(1, 1)[0];
      headerRow.values = ['Báo cáo thống kê học sinh'];
      headerRow.font = { bold: true, size: 14 };
      
      worksheet.insertRows(2, 1);
      
      // Add data
      let rowIndex = 4;
      for (const student of students) {
        const attempts = await ExamAttempt.findAll({
          where: { student_id: student.id, status: 'submitted' }
        });
        
        const scores = attempts.map(a => parseFloat(a.total_score || 0));
        const averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
        
        worksheet.insertRows(rowIndex, 1)[0].values = {
          full_name: student.full_name,
          email: student.email,
          totalAttempts: attempts.length,
          averageScore: Math.round(averageScore * 100) / 100,
          lastAttempt: attempts.length > 0 ? new Date(attempts[0].start_time).toLocaleDateString('vi-VN') : 'N/A'
        };
        rowIndex++;
      }
    }
    
    // Send file
    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="report-${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
