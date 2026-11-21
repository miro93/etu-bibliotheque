describe('Login', () => {
  beforeEach(() => cy.visit('/login'));

  it('shows the required errors when the form is submitted empty', () => {
    cy.contains('button', 'Login').click();

    cy.contains('Login is required');
    cy.contains('password is required');
  });

  it('stays on the login page when the credentials are refused', () => {
    cy.intercept('POST', '/api/login', {statusCode: 401, body: {message: 'Invalid credentials'}}).as('login');
    const alert = cy.stub().as('alert');
    cy.on('window:alert', alert);

    cy.get('input[formControlName=login]').type('jdoe');
    cy.get('input[formControlName=password]').type('wrong');
    cy.contains('button', 'Login').click();

    cy.wait('@login');
    cy.get('@alert').should('have.been.calledWithMatch', 'Invalid credentials');
    cy.url().should('include', '/login');
  });

  it('logs in then displays the students', () => {
    cy.intercept('POST', '/api/login', {token: 'fake-jwt'}).as('login');
    cy.intercept('GET', '/api/students', [
      {id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com'},
    ]).as('students');

    cy.get('input[formControlName=login]').type('jdoe');
    cy.get('input[formControlName=password]').type('password');
    cy.contains('button', 'Login').click();

    cy.wait('@login').its('request.body').should('deep.equal', {login: 'jdoe', password: 'password'});
    cy.url().should('include', '/students');
    cy.wait('@students').its('request.headers.authorization').should('eq', 'Bearer fake-jwt');
    cy.contains('tr[mat-row]', 'john.doe@test.com');
  });
});
