/**
 * Test Case 2: Dashboard and Stats Display
 * Tests home page stats, data loading, and dashboard functionality
 */
describe('Dashboard and Stats', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('student1@aptis.local', 'password123');
    cy.visit('/home');
  });

  it('should display user greeting with correct name', () => {
    // Check greeting message
    cy.get('[data-testid="user-greeting"]')
      .should('be.visible')
      .and('contain', 'Chào');
    
    // Should contain user's first name
    cy.get('[data-testid="user-greeting"]')
      .should('contain', 'Alice'); // Based on seed data
  });

  it('should load and display dashboard stats correctly', () => {
    // Wait for stats to load
    cy.get('[data-testid="stats-loading"]').should('not.exist');
    
    // Check all 4 stat cards are present
    cy.get('[data-testid="total-exams-stat"]').should('be.visible');
    cy.get('[data-testid="average-score-stat"]').should('be.visible');
    cy.get('[data-testid="streak-stat"]').should('be.visible');
    cy.get('[data-testid="total-time-stat"]').should('be.visible');
    
    // Verify total exams shows correct count (should be 5 from seed)
    cy.get('[data-testid="total-exams-value"]').should('contain', '5');
    
    // Verify stats have proper format
    cy.get('[data-testid="average-score-value"]').should('match', /^\d+\.?\d*%?$/);
    cy.get('[data-testid="streak-value"]').should('match', /^\d+$/);
    cy.get('[data-testid="total-time-value"]').should('match', /^\d+h?$/);
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
    cy.intercept('GET', '/api/student/dashboard/stats', {
      statusCode: 500,
      body: { message: 'Server Error' }
    }).as('statsError');
    
    cy.reload();
    
    // Should show error state but not crash
    cy.get('[data-testid="error-message"]').should('be.visible');
    
    // Should still show navigation
    cy.get('[data-testid="main-nav"]').should('be.visible');
  });

  it('should handle loading states', () => {
    // Intercept API to add delay
    cy.intercept('GET', '/api/student/dashboard/stats', {
      delay: 2000,
      fixture: 'dashboard-stats.json'
    }).as('slowStats');
    
    cy.reload();
    
    // Should show loading indicator
    cy.get('[data-testid="stats-loading"]').should('be.visible');
    
    // Wait for loading to complete
    cy.wait('@slowStats');
    cy.get('[data-testid="stats-loading"]').should('not.exist');
  });
});