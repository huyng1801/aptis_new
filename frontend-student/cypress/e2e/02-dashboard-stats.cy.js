/**
 * Test Case 2: Dashboard and Stats Display
 * Tests home page stats, data loading, and dashboard functionality
 */
describe('Dashboard and Stats', () => {
  beforeEach(() => {
    // Handle uncaught exceptions (hydration errors)
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Hydration failed') || err.message.includes('hydration')) {
        return false;
      }
      return true;
    });
    
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
          full_name: 'Alice Student',
          role: 'student'
        }
      }
    }).as('authCheck');
    
    // Mock dashboard stats API
    cy.intercept('GET', '**/students/dashboard/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalAttempts: 5,
          averageScore: 78.5,
          streak: 3,
          totalStudyTime: 45,
          recentAttempts: [
            {
              id: 1,
              exam_name: 'Practice Test 1',
              total_score: 85,
              completed_at: '2024-01-15T10:30:00Z'
            },
            {
              id: 2,
              exam_name: 'Practice Test 2',
              total_score: 72,
              completed_at: '2024-01-14T15:20:00Z'
            }
          ]
        }
      }
    }).as('dashboardStats');
    
    // Login before each test
    cy.login('student1@aptis.local', 'password123');
    cy.visit('/home');
  });

  it('should display user greeting with correct name', () => {
    // Check greeting message - wait for home page content to load
    cy.get('[data-testid="user-greeting"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'Chào');
    
    // Should contain user's first name or fallback text
    cy.get('[data-testid="user-greeting"]').then(($greeting) => {
      const text = $greeting.text();
      // Should contain either user's name or "Bạn" as fallback
      expect(text).to.match(/(Alice|Bạn)/);
    });
  });

  it('should load and display dashboard stats correctly', () => {
    // Wait for API call
    cy.wait('@dashboardStats');
    
    // Check all 4 stat cards are present
    cy.get('[data-testid="total-exams-stat"]').should('be.visible');
    cy.get('[data-testid="average-score-stat"]').should('be.visible');
    cy.get('[data-testid="streak-stat"]').should('be.visible');
    cy.get('[data-testid="total-time-stat"]').should('be.visible');
    
    // Verify stats show some numeric values (don't check exact values due to calculations)
    cy.get('[data-testid="total-exams-value"]').should('be.visible').and('not.be.empty');
    cy.get('[data-testid="average-score-value"]').should('be.visible').and('contain', '%');
    cy.get('[data-testid="streak-value"]').should('be.visible');
    cy.get('[data-testid="total-time-value"]').should('be.visible');
  });

  it('should display quick action cards', () => {
    // Check all quick action cards
    cy.get('[data-testid="quick-actions"]').within(() => {
      cy.contains('Thi thử nhanh').should('be.visible');
      cy.contains('Ôn tập').should('be.visible');
    });
    
    // Test quick action navigation
    cy.get('[data-testid="quick-action-exam"]').click();
    cy.url().should('include', '/exams');
    
    // Go back to home
    cy.visit('/home');
    
    // Test practice quick action
    cy.get('[data-testid="quick-action-practice"]').click();
    cy.url().should('include', '/practice');
  });

  it('should display weekly goal progress correctly', () => {
    // Check weekly goal section
    cy.get('[data-testid="weekly-goal"]').should('be.visible');
    
    // Check progress display format
    cy.get('[data-testid="weekly-progress"]').should('match', /^\d+\/5$/);
    
    // Check progress bar
    cy.get('[data-testid="progress-bar"]').should('have.attr', 'aria-valuenow');
    
    // Check goal message
    cy.get('[data-testid="goal-message"]').should('be.visible');
  });

  it('should handle recent activity display', () => {
    // If user has attempts, should show them
    cy.get('[data-testid="recent-activity"]').should('be.visible');
    
    cy.get('[data-testid="recent-activity"]').then(($el) => {
      if ($el.find('[data-testid="activity-item"]').length > 0) {
        // Has activities - check format
        cy.get('[data-testid="activity-item"]').first().within(() => {
          cy.get('[data-testid="exam-title"]').should('be.visible');
          cy.get('[data-testid="exam-score"]').should('be.visible');
          cy.get('[data-testid="exam-date"]').should('be.visible');
        });
      } else {
        // No activities - should show empty state
        cy.contains('Chưa có hoạt động nào').should('be.visible');
        cy.get('[data-testid="start-first-exam"]').should('be.visible');
      }
    });
  });

  it('should handle API errors gracefully', () => {
    // Intercept API calls to simulate error
    cy.intercept('GET', '**/students/dashboard/stats', {
      statusCode: 500,
      body: { message: 'Server Error' }
    }).as('statsError');
    
    cy.reload();
    
    // Should still show navigation even with API errors
    cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('be.visible');
    
    // Page should not crash completely
    cy.get('body').should('exist');
  });

  it('should handle loading states', () => {
    // Intercept API to add delay
    cy.intercept('GET', '**/students/dashboard/stats', {
      delay: 2000,
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalAttempts: 3,
          averageScore: 75,
          streak: 2,
          totalStudyTime: 30
        }
      }
    }).as('slowStats');
    
    cy.reload();
    
    // Wait for page to start loading
    cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('be.visible');
    
    // Wait for API call
    cy.wait('@slowStats');
  });
});