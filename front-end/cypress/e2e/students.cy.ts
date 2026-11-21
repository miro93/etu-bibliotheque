describe('Students', () => {
  const john = {id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com'};
  const jane = {id: 2, firstName: 'Jane', lastName: 'Roe', email: 'jane.roe@test.com'};

  // the API is stubbed : a later intercept on the same route takes over the previous one
  const studentsAre = (...students: object[]) => cy.intercept('GET', '/api/students', students).as('students');

  function visitAsLoggedUser(): void {
    cy.visit('/students', {onBeforeLoad: win => win.sessionStorage.setItem('token', 'fake-jwt')});
    cy.wait('@students');
  }

  it('redirects an anonymous visitor to the login page', () => {
    cy.visit('/students');

    cy.url().should('include', '/login');
  });

  it('redirects to the login page when the session has expired', () => {
    cy.intercept('GET', '/api/students', {statusCode: 401}).as('students');

    visitAsLoggedUser();

    cy.url().should('include', '/login');
    cy.window().its('sessionStorage').invoke('getItem', 'token').should('be.null');
  });

  it('lists the students', () => {
    studentsAre(john, jane);

    visitAsLoggedUser();

    cy.get('tr[mat-row]').should('have.length', 2);
    cy.contains('tr[mat-row]', 'jane.roe@test.com').should('contain', 'Jane').and('contain', 'Roe');
  });

  it('adds a student', () => {
    studentsAre(john);
    cy.intercept('POST', '/api/students', {statusCode: 201, body: jane}).as('create');
    visitAsLoggedUser();

    cy.contains('button', 'Ajouter').click();
    cy.contains('Nouvel étudiant');
    cy.get('mat-dialog-container input[formControlName=firstName]').type('Jane');
    cy.get('mat-dialog-container input[formControlName=lastName]').type('Roe');
    cy.get('mat-dialog-container input[formControlName=email]').type('jane.roe@test.com');
    studentsAre(john, jane);
    cy.get('mat-dialog-container').contains('button', 'Ajouter').click();

    cy.wait('@create').its('request.body')
      .should('deep.equal', {firstName: 'Jane', lastName: 'Roe', email: 'jane.roe@test.com'});
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('tr[mat-row]').should('have.length', 2);
  });

  it('refuses an invalid student', () => {
    studentsAre(john);
    cy.intercept('POST', '/api/students', cy.spy().as('create'));
    visitAsLoggedUser();

    cy.contains('button', 'Ajouter').click();
    cy.get('mat-dialog-container input[formControlName=email]').type('not-an-email');
    cy.get('mat-dialog-container').contains('button', 'Ajouter').click();

    cy.contains('Le prénom est obligatoire');
    cy.contains('Un email valide est obligatoire');
    cy.get('@create').should('not.have.been.called');
    cy.get('mat-dialog-container').should('exist');
  });

  it('tells when the email is already used', () => {
    studentsAre(john);
    cy.intercept('POST', '/api/students', {statusCode: 409}).as('create');
    visitAsLoggedUser();

    cy.contains('button', 'Ajouter').click();
    cy.get('mat-dialog-container input[formControlName=firstName]').type('Johnny');
    cy.get('mat-dialog-container input[formControlName=lastName]').type('Doe');
    cy.get('mat-dialog-container input[formControlName=email]').type(john.email);
    cy.get('mat-dialog-container').contains('button', 'Ajouter').click();

    cy.wait('@create');
    cy.contains('Cet email est déjà utilisé');
    cy.get('mat-dialog-container').should('exist');
  });

  it('edits a student', () => {
    const johnny = {...john, firstName: 'Johnny'};
    studentsAre(john);
    cy.intercept('PUT', '/api/students/1', johnny).as('update');
    visitAsLoggedUser();

    cy.contains('tr[mat-row]', john.email).click();
    cy.contains('Etudiant numéro 1');
    cy.get('mat-dialog-container input[formControlName=firstName]').should('have.value', 'John').clear().type('Johnny');
    studentsAre(johnny);
    cy.contains('button', 'Modifier').click();

    cy.wait('@update').its('request.body').should('deep.equal', johnny);
    cy.get('mat-dialog-container').should('not.exist');
    cy.contains('tr[mat-row]', 'Johnny');
  });

  it('deletes a student after confirmation', () => {
    studentsAre(john, jane);
    cy.intercept('DELETE', '/api/students/2', {statusCode: 204}).as('delete');
    visitAsLoggedUser();

    cy.contains('tr[mat-row]', jane.email).click();
    studentsAre(john);
    // Cypress accepts window.confirm by default
    cy.contains('button', 'Supprimer').click();

    cy.wait('@delete');
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('tr[mat-row]').should('have.length', 1);
  });

  it('keeps the student when the confirmation is refused', () => {
    studentsAre(john);
    cy.intercept('DELETE', '/api/students/1', cy.spy().as('delete'));
    cy.on('window:confirm', () => false);
    visitAsLoggedUser();

    cy.contains('tr[mat-row]', john.email).click();
    cy.contains('button', 'Supprimer').click();

    cy.get('@delete').should('not.have.been.called');
    cy.get('mat-dialog-container').should('exist');
  });
});
