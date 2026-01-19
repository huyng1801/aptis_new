/**
 * Cypress Support Commands
 * Custom commands for APTIS frontend automation tests
 */

// Login command for reuse across tests
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    // Mock login API for session establishment
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'test-auth-token-' + Math.random(),
        user: {
          id: 1,
          email: email,
          first_name: 'Alice',
          last_name: 'Student',
          role: 'student'
        }
      }
    });
    
    // Mock auth check
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          email: email,
          first_name: 'Alice',
          last_name: 'Student',
          role: 'student'
        }
      }
    });
    
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').clear().type(email);
    cy.get('[data-testid="password-input"]').clear().type(password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for redirect to home
    cy.url().should('include', '/home', { timeout: 10000 });
  }, {
    validate() {
      // Validate that user is still logged in by checking for user menu
      cy.get('[data-testid="user-menu"]').should('exist');
    }
  });
});

// Custom command to wait for API loading to complete
Cypress.Commands.add('waitForApiLoading', () => {
  cy.get('[data-testid*="loading"]').should('not.exist');
});

// Custom command to check responsive design
Cypress.Commands.add('checkResponsive', () => {
  // Test mobile view
  cy.viewport(375, 667);
  cy.get('[data-testid="mobile-menu"]').should('be.visible');
  
  // Test tablet view
  cy.viewport(768, 1024);
  
  // Test desktop view
  cy.viewport(1920, 1080);
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method, url, response, alias) => {
  cy.intercept(method, url, response).as(alias);
});

// Custom command to check accessibility
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Custom command to take screenshot for visual testing
Cypress.Commands.add('visualTest', (name) => {
  cy.screenshot(name, { capture: 'fullPage' });
});

// Custom command to test performance
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance;
    const navigation = performance.getEntriesByType('navigation')[0];
    
    // Check page load time (should be under 3 seconds)
    expect(navigation.loadEventEnd - navigation.fetchStart).to.be.lessThan(3000);
  });
});