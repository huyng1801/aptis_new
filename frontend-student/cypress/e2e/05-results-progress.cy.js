/**
 * Test Case 5: Results and Progress Tracking
 * Tests exam results display, scoring, and progress tracking
 */
describe('Results and Progress Tracking', () => {
  beforeEach(() => {
    // Login
    cy.login('student1@aptis.local', 'password123');
  });

  it('should display exam results page with detailed scores', () => {
    // Navigate to results page
    cy.visit('/results');
    
    // Check page title
    cy.get('[data-testid="results-title"]').should('contain', 'Kết quả thi');
    
    // Check if there are results to display
    cy.get('[data-testid="results-container"]').then(($el) => {
      if ($el.find('[data-testid="result-item"]').length > 0) {
        // Has results - verify display
        cy.get('[data-testid="result-item"]').first().within(() => {
          cy.get('[data-testid="exam-title"]').should('be.visible');
          cy.get('[data-testid="total-score"]').should('be.visible');
          cy.get('[data-testid="exam-date"]').should('be.visible');
          cy.get('[data-testid="view-details-btn"]').should('be.visible');
        });
      } else {
        // No results - empty state
        cy.contains('Chưa có kết quả thi nào').should('be.visible');
        cy.get('[data-testid="start-exam-link"]').should('be.visible');
      }
    });
  });

  it('should show detailed result breakdown when viewing specific result', () => {
    // Mock result data for testing
    cy.intercept('GET', '/api/student/attempts/*/results', {
      fixture: 'exam-result-detail.json'
    }).as('resultDetails');
    
    // Navigate to results and click on first result
    cy.visit('/results');
    
    // If results exist, click to view details
    cy.get('[data-testid="result-item"]').then(($items) => {
      if ($items.length > 0) {
        cy.wrap($items).first().find('[data-testid="view-details-btn"]').click();
        
        cy.wait('@resultDetails');
        
        // Should show detailed breakdown
        cy.get('[data-testid="result-details"]').should('be.visible');
        
        // Check score breakdown by skill
        cy.get('[data-testid="skill-scores"]').should('be.visible');
        cy.get('[data-testid="reading-score"]').should('be.visible');
        cy.get('[data-testid="listening-score"]').should('be.visible');
        cy.get('[data-testid="writing-score"]').should('be.visible');
        cy.get('[data-testid="speaking-score"]').should('be.visible');
        
        // Check CEFR level display
        cy.get('[data-testid="cefr-level"]').should('be.visible');
        
        // Check performance analysis
        cy.get('[data-testid="performance-analysis"]').should('be.visible');
      } else {
        cy.log('No results available to test detailed view');
      }
    });
  });

  it('should display progress tracking over time', () => {
    // Visit progress page
    cy.visit('/progress');
    
    // Check progress charts and metrics
    cy.get('[data-testid="progress-overview"]').should('be.visible');
    
    // Check score progression chart
    cy.get('[data-testid="score-chart"]').should('be.visible');
    
    // Check skill-wise progress
    cy.get('[data-testid="skill-progress"]').should('be.visible');
    cy.get('[data-testid="skill-progress"]').within(() => {
      cy.get('[data-testid="reading-progress"]').should('be.visible');
      cy.get('[data-testid="listening-progress"]').should('be.visible');
      cy.get('[data-testid="writing-progress"]').should('be.visible');
      cy.get('[data-testid="speaking-progress"]').should('be.visible');
    });
    
    // Check improvement recommendations
    cy.get('[data-testid="recommendations"]').should('be.visible');
  });

  it('should filter and sort results', () => {
    cy.visit('/results');
    
    // Test date filter
    cy.get('[data-testid="date-filter"]').click();
    cy.get('[data-testid="last-month"]').click();
    
    // Results should filter accordingly
    cy.get('[data-testid="results-loading"]').should('exist');
    cy.get('[data-testid="results-loading"]').should('not.exist');
    
    // Test skill filter
    cy.get('[data-testid="skill-filter"]').select('Reading');
    
    // Should show only reading results
    cy.get('[data-testid="result-item"]').each(($item) => {
      cy.wrap($item).should('contain', 'Reading');
    });
    
    // Test sort options
    cy.get('[data-testid="sort-select"]').select('score-desc');
    
    // Results should be sorted by score (descending)
    cy.get('[data-testid="total-score"]').then(($scores) => {
      const scores = Array.from($scores, el => parseInt(el.textContent));
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).to.deep.equal(sortedScores);
    });
  });

  it('should show AI feedback and recommendations', () => {
    // Mock detailed result with AI feedback
    cy.intercept('GET', '/api/student/attempts/*/results', {
      fixture: 'result-with-ai-feedback.json'
    }).as('aiResult');
    
    cy.visit('/results');
    
    // View detailed result
    cy.get('[data-testid="result-item"]').first()
      .find('[data-testid="view-details-btn"]').click();
    
    cy.wait('@aiResult');
    
    // Check AI feedback sections
    cy.get('[data-testid="ai-feedback"]').should('be.visible');
    
    // Check writing feedback
    cy.get('[data-testid="writing-feedback"]').within(() => {
      cy.get('[data-testid="grammar-score"]').should('be.visible');
      cy.get('[data-testid="vocabulary-score"]').should('be.visible');
      cy.get('[data-testid="coherence-score"]').should('be.visible');
      cy.get('[data-testid="feedback-comment"]').should('be.visible');
    });
    
    // Check speaking feedback  
    cy.get('[data-testid="speaking-feedback"]').within(() => {
      cy.get('[data-testid="pronunciation-score"]').should('be.visible');
      cy.get('[data-testid="fluency-score"]').should('be.visible');
      cy.get('[data-testid="content-score"]').should('be.visible');
    });
    
    // Check improvement suggestions
    cy.get('[data-testid="improvement-suggestions"]').should('be.visible');
  });

  it('should export results and generate reports', () => {
    cy.visit('/results');
    
    // Check export functionality
    cy.get('[data-testid="export-results"]').click();
    
    // Should show export options
    cy.get('[data-testid="export-modal"]').should('be.visible');
    cy.get('[data-testid="export-pdf"]').should('be.visible');
    cy.get('[data-testid="export-csv"]').should('be.visible');
    
    // Test PDF export
    cy.get('[data-testid="export-pdf"]').click();
    
    // Should trigger download (check that download started)
    cy.get('[data-testid="download-progress"]').should('be.visible');
  });

  it('should handle result sharing and social features', () => {
    // View a good result
    cy.visit('/results');
    cy.get('[data-testid="result-item"]').first()
      .find('[data-testid="view-details-btn"]').click();
    
    // Check share options for achievement
    cy.get('[data-testid="total-score"]').then(($score) => {
      const score = parseInt($score.text());
      if (score >= 80) { // Good score eligible for sharing
        cy.get('[data-testid="share-result"]').should('be.visible');
        cy.get('[data-testid="share-result"]').click();
        
        // Check share modal
        cy.get('[data-testid="share-modal"]').should('be.visible');
        cy.get('[data-testid="share-social"]').should('be.visible');
      }
    });
  });

  it('should track and display learning streaks', () => {
    cy.visit('/progress');
    
    // Check streak tracking
    cy.get('[data-testid="learning-streak"]').should('be.visible');
    cy.get('[data-testid="current-streak"]').should('contain', 'ngày');
    cy.get('[data-testid="longest-streak"]').should('be.visible');
    
    // Check streak calendar/heatmap
    cy.get('[data-testid="activity-calendar"]').should('be.visible');
    
    // Check streak achievements/badges
    cy.get('[data-testid="streak-badges"]').should('be.visible');
  });
});