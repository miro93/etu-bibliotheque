describe('Register', () => {
  beforeEach(() => cy.visit('/register'));

  it('shows the required errors when the form is submitted empty', () => {
    cy.intercept('POST', '/api/register', cy.spy().as('register'));

    cy.contains('button', 'Register').click();

    cy.contains('First Name is required');
    cy.contains('Last Name is required');
    cy.contains('Login is required');
    cy.contains('password is required');
    cy.get('@register').should('not.have.been.called');
  });

  it('registers the user then redirects to the login page', () => {
    cy.intercept('POST', '/api/register', {statusCode: 201}).as('register');

    cy.get('input[formControlName=firstName]').type('John');
    cy.get('input[formControlName=lastName]').type('Doe');
    cy.get('input[formControlName=login]').type('jdoe');
    cy.get('input[formControlName=password]').type('password');
    cy.contains('button', 'Register').click();

    cy.wait('@register').its('request.body')
      .should('deep.equal', {firstName: 'John', lastName: 'Doe', login: 'jdoe', password: 'password'});
    cy.url().should('include', '/login');
  });

  it('clears the form on cancel', () => {
    cy.get('input[formControlName=firstName]').type('John');

    cy.contains('button', 'Cancel').click();

    cy.get('input[formControlName=firstName]').should('have.value', '');
  });
});
