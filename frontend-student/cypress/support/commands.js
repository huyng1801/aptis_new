/**
 * Cypress Support Commands
 * Custom commands for APTIS frontend automation tests
 */

// Global exception handler for hydration errors
Cypress.on('uncaught:exception', (err) => {
  // Ignore hydration mismatches - these are common in SSR testing
  if (err.message.includes('Hydration failed') || 
      err.message.includes('hydration') ||
      err.message.includes('switch to client rendering') ||
      err.message.includes('does not match what was rendered on the server')) {
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Login command for reuse across tests
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    // Mock login API for session establishment
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'test-auth-token-' + Math.random(),
          refreshToken: 'test-refresh-token-' + Math.random(),
          user: {
            id: 1,
            email: email,
            first_name: 'Alice',
            last_name: 'Student',
            full_name: 'Alice Student',
            role: 'student'
          }
        }
      }
    }).as('loginApi');
    
    // Mock auth status check
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 1,
            email: email,
            first_name: 'Alice',
            last_name: 'Student',
            full_name: 'Alice Student',
            role: 'student'
          }
        }
      }
    }).as('authMeApi');

    // Mock dashboard data
    cy.intercept('GET', '**/api/students/dashboard', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          stats: {
            totalAttempts: 5,
            averageScore: 85,
            streak: 3,
            completedThisWeek: 2
          },
          recentAttempts: []
        }
      }
    }).as('dashboardApi');
    
    cy.visit('/login');
    cy.get('[data-testid="email-input"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="email-input"]').clear().type(email);
    cy.get('[data-testid="password-input"]').clear().type(password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for redirect to home
    cy.url().should('include', '/home', { timeout: 15000 });
    
    // Wait for page to fully load - check for user menu in header instead of home content
    cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('be.visible');
  }, {
    validate() {
      // Validate that user is still logged in by checking for user menu in header
      cy.visit('/home');
      cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('be.visible');
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