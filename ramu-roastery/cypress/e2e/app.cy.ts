describe('Ramu Roastery App', () => {
  it('should navigate to the home page successfully', () => {
    cy.visit('/')
    cy.get('h1').should('exist')
  })
})
