/**
 * Test Case 3: Exam Taking Flow
 * Tests the complete exam taking process from start to finish
 */
describe('Exam Taking Flow', () => {
  beforeEach(() => {
    // Mock auth check
    cy.intercept('GET', '**/users/profile', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: 'student1@aptis.local',
          first_name: 'Alice',
          last_name: 'Student',
          role: 'student'
        }
      }
    });
    
    // Mock exams list API
    cy.intercept('GET', '**/students/exams*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            title: 'APTIS Full Test 1',
            description: 'Complete APTIS exam',
            duration_minutes: 120,
            total_questions: 50
          },
          {
            id: 2,
            title: 'APTIS Full Test 2', 
            description: 'Complete APTIS exam',
            duration_minutes: 120,
            total_questions: 50
          },
          {
            id: 3,
            title: 'APTIS Reading Practice',
            description: 'Reading skill practice',
            duration_minutes: 30,
            total_questions: 20
          }
        ]
      }
    });
    
    // Login and navigate to exams page
    cy.login('student1@aptis.local', 'password123');
    cy.visit('/exams');
  });

  it('should display available exams and allow exam selection', () => {
    // Check exam list loads
    cy.get('[data-testid="exam-list"]').should('be.visible');
    
    // Should show 5 exams from seed data
    cy.get('[data-testid="exam-card"]').should('have.length', 5);
    
    // Check exam card content
    cy.get('[data-testid="exam-card"]').first().within(() => {
      cy.get('[data-testid="exam-title"]').should('be.visible');
      cy.get('[data-testid="exam-description"]').should('be.visible');
      cy.get('[data-testid="exam-duration"]').should('contain', 'phút');
      cy.get('[data-testid="start-exam-btn"]').should('be.visible');
    });
  });

  it('should start exam and navigate to exam taking interface', () => {
    // Click on first exam
    cy.get('[data-testid="exam-card"]').first()
      .find('[data-testid="start-exam-btn"]').click();
    
    // Should navigate to exam taking page
    cy.url().should('include', '/exams/');
    cy.url().should('include', '/take');
    
    // Check exam interface elements
    cy.get('[data-testid="exam-header"]').should('be.visible');
    cy.get('[data-testid="timer"]').should('be.visible');
    cy.get('[data-testid="question-content"]').should('be.visible');
    cy.get('[data-testid="answer-section"]').should('be.visible');
    cy.get('[data-testid="navigation-buttons"]').should('be.visible');
  });

  it('should handle question navigation and timer', () => {
    // Start first exam
    cy.get('[data-testid="exam-card"]').first()
      .find('[data-testid="start-exam-btn"]').click();
    
    // Check timer is running
    cy.get('[data-testid="timer"]').should('contain', ':');
    
    // Check question navigation
    cy.get('[data-testid="next-question"]').should('be.visible');
    
    // Navigate to next question
    cy.get('[data-testid="next-question"]').click();
    
    // Should show question 2
    cy.get('[data-testid="question-number"]').should('contain', '2');
    
    // Previous button should be enabled
    cy.get('[data-testid="prev-question"]').should('be.enabled');
  });

  it('should allow answering different question types', () => {
    // Start exam
    cy.get('[data-testid="exam-card"]').first()
      .find('[data-testid="start-exam-btn"]').click();
    
    // Handle Multiple Choice Question
    cy.get('[data-testid="question-type"]').then(($el) => {
      const questionType = $el.text();
      
      if (questionType.includes('multiple_choice')) {
        // Select an option
        cy.get('[data-testid="option-A"]').click();
        cy.get('[data-testid="option-A"]').should('be.checked');
      } else if (questionType.includes('text')) {
        // Type answer
        cy.get('[data-testid="text-answer"]').type('This is my answer');
        cy.get('[data-testid="text-answer"]').should('have.value', 'This is my answer');
      } else if (questionType.includes('speaking')) {
        // Check audio controls
        cy.get('[data-testid="record-button"]').should('be.visible');
        cy.get('[data-testid="audio-timer"]').should('be.visible');
      }
    });
    
    // Save answer
    cy.get('[data-testid="save-answer"]').click();
    cy.get('[data-testid="answer-saved"]').should('be.visible');
  });

  it('should handle exam submission', () => {
    // Start exam
    cy.get('[data-testid="exam-card"]').first()
      .find('[data-testid="start-exam-btn"]').click();
    
    // Mock API calls
    cy.intercept('POST', '**/students/attempts/*/submit', {
      statusCode: 200,
      body: { 
        success: true, 
        message: 'Exam submitted successfully' 
      }
    }).as('submitExam');
    
    // Navigate to last question
    cy.get('[data-testid="submit-exam"]').click();
    
    // Confirm submission
    cy.get('[data-testid="confirm-submit"]').click();
    
    // Wait for submission
    cy.wait('@submitExam');
    
    // Should redirect to results page
    cy.url().should('include', '/results/');
    
    // Check success message
    cy.get('[data-testid="submit-success"]').should('be.visible');
  });

  it('should handle exam auto-save and resume', () => {
    // Start exam
    cy.get('[data-testid="exam-card"]').first()
      .find('[data-testid="start-exam-btn"]').click();
    
    // Answer first question
    cy.get('[data-testid="option-A"]').click();
    cy.get('[data-testid="save-answer"]').click();
    
    // Check auto-save indicator
    cy.get('[data-testid="auto-save-status"]').should('contain', 'Đã lưu');
    
    // Reload page (simulate browser refresh)
    cy.reload();
    
    // Should resume at same question
    cy.get('[data-testid="question-number"]').should('contain', '1');
    
    // Previous answer should be preserved
    cy.get('[data-testid="option-A"]').should('be.checked');
  });

  it('should handle time warnings and auto-submission', () => {
    // Mock short timer for testing
    cy.intercept('GET', '**/students/exams/*/take', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          exam: { duration_minutes: 1 }, // 1 minute exam
          sections: [],
          questions: []
        }
      }
    }).as('shortExam');
    
    // Start exam
    cy.get('[data-testid="exam-card"]').first()
      .find('[data-testid="start-exam-btn"]').click();
    
    cy.wait('@shortExam');
    
    // Should show time warning at 30 seconds
    cy.get('[data-testid="time-warning"]', { timeout: 35000 }).should('be.visible');
    
    // Should auto-submit when time runs out
    cy.get('[data-testid="auto-submit-modal"]', { timeout: 65000 }).should('be.visible');
  });
});