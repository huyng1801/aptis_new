'use client';

import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Code,
  Paper,
  Divider
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

/**
 * Component hiển thị cấu trúc data cho từng loại câu hỏi dựa trên seed data
 */
export default function QuestionStructureGuide({ questionType }) {
  const getQuestionStructure = () => {
    const code = questionType?.code;
    
    switch (code) {
      case 'READING_GAP_FILL':
        return {
          title: 'Gap Filling - Điền từ vào chỗ trống',
          description: 'Học sinh chọn từ từ danh sách để điền vào các chỗ trống được đánh dấu [GAP1], [GAP2]...',
          structure: {
            passage: 'Đoạn văn với các chỗ trống [GAP1], [GAP2], [GAP3]...',
            options: ['từ1', 'từ2', 'từ3', 'từ4', 'từ5'],
            correctAnswers: ['từ1', 'từ2', 'từ3', 'từ4', 'từ5'],
            prompt: 'Choose one word from the list for each gap. The first one is done for you.'
          },
          example: `{
  "passage": "Dear Sam,\\n\\nI hope you're doing [GAP1]! I wanted to tell you about my recent trip to the park. It was [GAP2] a lovely day to be outside.",
  "options": ["well", "only", "really", "under", "much", "food"],
  "correctAnswers": ["well", "only", "really", "under", "much", "food"],
  "prompt": "Choose one word from the list for each gap. The first one is done for you."
}`
        };

      case 'READING_ORDERING':
        return {
          title: 'Ordering - Sắp xếp câu theo thứ tự',
          description: 'Học sinh sắp xếp các câu cho theo thứ tự logic hoặc thời gian',
          structure: {
            title: 'Tiêu đề bài',
            passage: 'Mô tả ngắn',
            sentences: ['Câu 1', 'Câu 2', 'Câu 3', 'Câu 4', 'Câu 5'],
            correctOrder: [1, 2, 3, 4, 5]
          },
          example: `{
  "title": "Tom Harper (Biography Ordering)",
  "passage": "This is the short summary of Tom Harper life.",
  "sentences": [
    "When he was young, he began writing short stories for a magazine.",
    "He soon wrote regularly for that magazine, sharing his creative ideas with many readers.",
    "At one point, he almost left his job, but then he decided to create unusual characters."
  ],
  "correctOrder": [1, 2, 3]
}`
        };

      case 'READING_MATCHING':
        return {
          title: 'Matching - Ghép câu hỏi với người',
          description: 'Học sinh đọc văn bản về nhiều người và trả lời câu hỏi về từng người',
          structure: {
            content: 'Văn bản mô tả nhiều người (Person A, B, C, D...)',
            questions: [
              { text: 'Câu hỏi 1?', correct: 'A' },
              { text: 'Câu hỏi 2?', correct: 'B' }
            ]
          },
          example: `{
  "content": "Person A: I have to read a lot for my job...\\nPerson B: My wife is always complaining...",
  "questions": [
    {"text": "Who thinks reading factual books is boring?", "correct": "A"},
    {"text": "Who reads more than another family member?", "correct": "B"}
  ]
}`
        };

      case 'READING_MATCHING_HEADINGS':
        return {
          title: 'Matching Headings - Ghép tiêu đề với đoạn văn',
          description: 'Học sinh chọn tiêu đề phù hợp cho từng đoạn văn',
          structure: {
            title: 'Tiêu đề bài',
            paragraphs: ['Đoạn văn 1', 'Đoạn văn 2', 'Đoạn văn 3'],
            headings: ['Tiêu đề A', 'Tiêu đề B', 'Tiêu đề C', 'Tiêu đề D'],
            correctAnswers: ['A', 'C', 'B']
          },
          example: `{
  "title": "Online Learning vs Traditional Learning",
  "paragraphs": ["Đoạn về ưu điểm học online...", "Đoạn về nhược điểm..."],
  "headings": ["Advantages of Online Learning", "Disadvantages", "Future Trends"],
  "correctAnswers": ["A", "B"]
}`
        };

      // Listening
      case 'LISTENING_MCQ':
        return {
          title: 'Listening Multiple Choice',
          description: 'Học sinh nghe và chọn đáp án đúng',
          structure: {
            audioUrl: 'URL file âm thanh',
            transcript: 'Transcript (không hiển thị cho học sinh)',
            question: 'Câu hỏi',
            options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
            correctAnswer: 'B'
          }
        };

      // Writing
      case 'WRITING_SHORT':
      case 'WRITING_FORM':
      case 'WRITING_LONG':
      case 'WRITING_EMAIL':
      case 'WRITING_ESSAY':
        return {
          title: `Writing Task - ${questionType?.question_type_name}`,
          description: 'Câu hỏi viết được chấm bằng AI',
          structure: {
            prompt: 'Yêu cầu viết',
            context: 'Bối cảnh (nếu có)',
            wordLimit: 'Giới hạn từ',
            timeLimit: 'Giới hạn thời gian',
            scoringCriteria: 'Tiêu chí chấm điểm AI'
          }
        };

      // Speaking
      case 'SPEAKING_INTRO':
      case 'SPEAKING_DESCRIPTION':
      case 'SPEAKING_COMPARISON':
      case 'SPEAKING_DISCUSSION':
        return {
          title: `Speaking Task - ${questionType?.question_type_name}`,
          description: 'Câu hỏi nói được chấm bằng AI',
          structure: {
            prompt: 'Yêu cầu nói',
            context: 'Bối cảnh',
            timeLimit: 'Thời gian chuẩn bị + Thời gian nói',
            imageUrl: 'URL hình ảnh (nếu có)',
            scoringCriteria: 'Tiêu chí chấm điểm AI'
          }
        };

      default:
        return {
          title: 'Loại câu hỏi chưa được hỗ trợ',
          description: `Loại câu hỏi ${code} chưa có cấu trúc dữ liệu.`,
          structure: {},
          example: ''
        };
    }
  };

  const structureData = getQuestionStructure();

  if (!questionType) {
    return (
      <Box p={3}>
        <Typography>Chọn loại câu hỏi để xem cấu trúc dữ liệu</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            📚 Hướng dẫn: {structureData.title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body1" paragraph>
              {structureData.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Cấu trúc dữ liệu:
            </Typography>
            
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
              <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(structureData.structure, null, 2)}
              </pre>
            </Paper>
            
            {structureData.example && (
              <>
                <Typography variant="h6" gutterBottom>
                  Ví dụ:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e8' }}>
                  <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                    {structureData.example}
                  </pre>
                </Paper>
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}