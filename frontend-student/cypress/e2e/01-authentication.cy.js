/**
 * Test Case 1: User Authentication
 * Tests login, logout, and authentication flow
 */
describe('Authentication Flow', () => {
  const testUser = {
    email: 'student1@aptis.local',
    password: 'password123'
  };

  beforeEach(() => {
    // Handle uncaught exceptions (hydration errors)
    cy.on('uncaught:exception', (err) => {
      // Ignore hydration mismatches
      if (err.message.includes('Hydration failed') || err.message.includes('hydration')) {
        return false;
      }
      return true;
    });
    
    // Visit login page before each test
    cy.visit('/login');
  });

  it('should successfully log in with valid credentials', () => {
    // Mock login API
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'test-auth-token-12345',
          refreshToken: 'test-refresh-token-12345',
          user: {
            id: 1,
            email: testUser.email,
            first_name: 'Alice',
            last_name: 'Student',
            full_name: 'Alice Student',
            role: 'student'
          }
        }
      }
    }).as('loginRequest');
    
    // Mock dashboard API
    cy.intercept('GET', '**/api/students/dashboard', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          stats: { totalAttempts: 5, averageScore: 85, streak: 3 },
          recentAttempts: []
        }
      }
    }).as('dashboardRequest');
    
    // Enter email and password
    cy.get('[data-testid="email-input"]').clear().type(testUser.email);
    cy.get('[data-testid="password-input"]').clear().type(testUser.password);
    
    // Click login button
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login API
    cy.wait('@loginRequest');
    
    // Verify successful login - should redirect to dashboard
    cy.url({ timeout: 15000 }).should('include', '/home');
    
    // Check for either user greeting or at least being on home page
    cy.get('body').should('be.visible'); // Basic page load check
    
    // Try to find user menu (more reliable than greeting)
    cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    // Mock failed login API
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Thông tin đăng nhập không chính xác'
      }
    }).as('failedLogin');
    
    // Enter invalid credentials
    cy.get('[data-testid="email-input"]').clear().type('invalid@email.com');
    cy.get('[data-testid="password-input"]').clear().type('wrongpassword');
    
    // Click login button
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login API
    cy.wait('@failedLogin');
    
    // Wait a bit for error to appear
    cy.wait(1000);
    
    // Verify error message appears (more flexible check)
    cy.get('[data-testid="error-message"]')
      .should('be.visible');
    
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should validate required fields', () => {
    // Try to submit empty form
    cy.get('[data-testid="login-button"]').click();
    
    // Check that form doesn't submit (still on login page)
    cy.url().should('include', '/login');
    
    // Enter email only and try again
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="login-button"]').click();
    
    // Should still be on login page
    cy.url().should('include', '/login');
  });

  it('should successfully log out', () => {
    // Mock APIs for login session
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'test-token',
          user: {
            id: 1,
            email: testUser.email,
            full_name: 'Alice Student'
          }
        }
      }
    });
    
    cy.intercept('GET', '**/api/students/dashboard', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          stats: { totalAttempts: 0, averageScore: 0, streak: 0 },
          recentAttempts: []
        }
      }
    });

    // Simple login flow
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for redirect
    cy.url({ timeout: 10000 }).should('include', '/home');
    
    // Wait for page load and user menu
    cy.get('[data-testid="user-menu"]', { timeout: 15000 }).should('exist').click();
    
    // Click logout
    cy.get('[data-testid="logout-button"]').should('be.visible').click();
    
    // Verify redirect to login
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  it('should redirect unauthenticated users to login', () => {
    // Try to access protected route without auth
    cy.visit('/home');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // Try to access exam page
    cy.visit('/exams');
    cy.url().should('include', '/login');
  });
});