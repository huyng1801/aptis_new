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
    // Visit login page before each test
    cy.visit('/login');
  });

  it('should successfully log in with valid credentials', () => {
    // Mock login API
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'test-auth-token-12345',
        user: {
          id: 1,
          email: testUser.email,
          first_name: 'Alice',
          last_name: 'Student',
          role: 'student'
        }
      }
    }).as('loginRequest');
    
    // Enter email and password
    cy.get('[data-testid="email-input"]').clear().type(testUser.email);
    cy.get('[data-testid="password-input"]').clear().type(testUser.password);
    
    // Click login button
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login API
    cy.wait('@loginRequest');
    
    // Verify successful login - should redirect to dashboard
    cy.url().should('include', '/home');
    cy.get('[data-testid="user-greeting"]').should('contain', 'Chào');
    
    // Verify user menu is present
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    // Mock failed login API
    cy.intercept('POST', '/api/auth/login', {
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
    
    // Verify error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Thông tin đăng nhập không chính xác');
    
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should validate required fields', () => {
    // Try to submit empty form
    cy.get('[data-testid="login-button"]').click();
    
    // Check email validation
    cy.get('[data-testid="email-error"]').should('contain', 'Email là bắt buộc');
    
    // Enter email only
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="login-button"]').click();
    
    // Check password validation
    cy.get('[data-testid="password-error"]').should('contain', 'Mật khẩu là bắt buộc');
  });

  it('should successfully log out', () => {
    // Login first
    cy.login(testUser.email, testUser.password);
    
    // Navigate to dashboard
    cy.visit('/home');
    
    // Click user menu
    cy.get('[data-testid="user-menu"]').click();
    
    // Click logout
    cy.get('[data-testid="logout-button"]').click();
    
    // Verify redirect to login
    cy.url().should('include', '/login');
    
    // Verify localStorage is cleared
    cy.window().its('localStorage.token').should('not.exist');
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