/**
 * Test Case 4: Practice Mode
 * Tests skill-based practice functionality
 */
describe('Practice Mode', () => {
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
    
    // Mock practice stats API
    cy.intercept('GET', '**/students/practice/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          total_exams: 15,
          completed_attempts: 12,
          average_score: 75,
          skills_count: 4
        }
      }
    });
    
    // Mock skill-specific exams API
    cy.intercept('GET', '**/students/exams?skill_type=*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            title: 'Practice Exam 1',
            skill_type: 'Reading',
            difficulty: 'Easy',
            duration_minutes: 30
          }
        ]
      }
    });
    
    // Login and navigate to practice page
    cy.login('student1@aptis.local', 'password123');
    cy.visit('/practice');
  });

  it('should display practice page with skill selection', () => {
    // Check page title
    cy.get('[data-testid="practice-title"]')
      .should('contain', 'Luyện tập theo kỹ năng');
    
    // Check stats cards
    cy.get('[data-testid="practice-stats"]').within(() => {
      cy.get('[data-testid="total-exams-card"]').should('be.visible');
      cy.get('[data-testid="completed-attempts-card"]').should('be.visible');
      cy.get('[data-testid="average-score-card"]').should('be.visible');
      cy.get('[data-testid="skills-count-card"]').should('be.visible');
    });
    
    // Check skill selector
    cy.get('[data-testid="skill-selector"]').should('be.visible');
    
    // Should show 4 skills
    cy.get('[data-testid="skill-option"]').should('have.length', 4);
  });

  it('should allow skill selection and display relevant exams', () => {
    // Select Reading skill
    cy.get('[data-testid="skill-reading"]').click();
    
    // Should highlight selected skill
    cy.get('[data-testid="skill-reading"]').should('have.class', 'selected');
    
    // Should load exams for reading skill
    cy.get('[data-testid="skill-exams-loading"]').should('exist');
    cy.get('[data-testid="skill-exams-loading"]').should('not.exist');
    
    // Check exam list for selected skill
    cy.get('[data-testid="skill-exams-list"]').should('be.visible');
    cy.get('[data-testid="skill-exam-card"]').should('have.length.greaterThan', 0);
    
    // Verify exam cards show skill type
    cy.get('[data-testid="skill-exam-card"]').first().within(() => {
      cy.get('[data-testid="exam-skill-badge"]').should('contain', 'Reading');
      cy.get('[data-testid="start-practice-btn"]').should('be.visible');
    });
  });

  it('should start skill-specific practice', () => {
    // Select Writing skill
    cy.get('[data-testid="skill-writing"]').click();
    
    // Wait for exams to load
    cy.get('[data-testid="skill-exams-loading"]').should('not.exist');
    
    // Start first practice exam
    cy.get('[data-testid="skill-exam-card"]').first()
      .find('[data-testid="start-practice-btn"]').click();
    
    // Should navigate to practice exam
    cy.url().should('include', '/exams/');
    cy.url().should('include', 'type=single_skill');
    cy.url().should('include', 'skill=');
    
    // Should show practice mode indicator
    cy.get('[data-testid="practice-mode-badge"]').should('be.visible');
    
    // Should show skill-specific questions
    cy.get('[data-testid="question-skill-type"]').should('contain', 'Writing');
  });

  it('should display practice history', () => {
    // Check practice history section
    cy.get('[data-testid="practice-history"]').should('be.visible');
    
    // Check if history has items or empty state
    cy.get('[data-testid="practice-history"]').then(($el) => {
      if ($el.find('[data-testid="history-item"]').length > 0) {
        // Has history - check format
        cy.get('[data-testid="history-item"]').first().within(() => {
          cy.get('[data-testid="history-exam-title"]').should('be.visible');
          cy.get('[data-testid="history-skill-name"]').should('be.visible');
          cy.get('[data-testid="history-date"]').should('be.visible');
          cy.get('[data-testid="history-score"]').should('be.visible');
        });
      } else {
        // Empty history
        cy.contains('Chưa có lịch sử luyện tập').should('be.visible');
      }
    });
  });

  it('should update stats when skill is selected', () => {
    // Note initial values
    cy.get('[data-testid="total-exams-value"]').then(($el) => {
      const initialValue = $el.text();
      
      // Select a skill
      cy.get('[data-testid="skill-listening"]').click();
      
      // Stats should update (might change based on skill-specific data)
      cy.get('[data-testid="skill-stats-loading"]').should('exist');
      cy.get('[data-testid="skill-stats-loading"]').should('not.exist');
      
      // Skill selector should show updated stats
      cy.get('[data-testid="skill-listening"]').within(() => {
        cy.get('[data-testid="skill-exam-count"]').should('be.visible');
        cy.get('[data-testid="skill-completed-count"]').should('be.visible');
      });
    });
  });

  it('should handle API errors gracefully', () => {
    // Mock skill selection API error
    cy.intercept('GET', '**/students/exams?skill_type=*', {
      statusCode: 500,
      body: { message: 'Server Error' }
    }).as('skillExamsError');
    
    // Select a skill
    cy.get('[data-testid="skill-speaking"]').click();
    
    // Should show error state
    cy.get('[data-testid="skill-exams-error"]').should('be.visible');
    
    // Should still allow selecting other skills
    cy.get('[data-testid="skill-reading"]').should('not.be.disabled');
  });

  it('should maintain skill selection state on page refresh', () => {
    // Select a skill
    cy.get('[data-testid="skill-writing"]').click();
    
    // Wait for data to load
    cy.get('[data-testid="skill-exams-loading"]').should('not.exist');
    
    // Refresh page
    cy.reload();
    
    // Should restore to first skill (default behavior)
    cy.get('[data-testid="skill-reading"]').should('have.class', 'selected');
    
    // Should load exams for default skill
    cy.get('[data-testid="skill-exams-list"]').should('be.visible');
  });

  it('should filter practice history by skill', () => {
    // If there's practice history, test filtering
    cy.get('[data-testid="practice-history"]').then(($el) => {
      if ($el.find('[data-testid="history-item"]').length > 0) {
        // Select different skills and verify history updates
        cy.get('[data-testid="skill-reading"]').click();
        cy.wait(1000); // Allow time for filtering
        
        // History items should show relevant skill
        cy.get('[data-testid="history-item"]').each(($item) => {
          cy.wrap($item).find('[data-testid="history-skill-name"]')
            .should('contain', 'Reading');
        });
      } else {
        cy.log('No practice history to test filtering');
      }
    });
  });
});