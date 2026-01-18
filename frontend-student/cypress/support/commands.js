/**
 * Cypress Support Commands
 * Custom commands for APTIS frontend automation tests
 */

// Login command for reuse across tests
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/home');
    
    // Store auth token
    cy.window().its('localStorage.token').should('exist');
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