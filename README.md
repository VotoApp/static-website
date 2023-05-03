# Voto Static Site 

The static website that will power the Voto Content Insights Platform. Right now, this hosts
a waitlist signup that allows anyone who is interested to input their email.

### Waitlist Flow

The current sign up flow is the following:

- Home Page
  - This gives a brief intro to Voto and allows users to join the waitlist
- Email Entry
  - This flow lets users input their email, validates (with debouncing) as the
  user types, and lets the user submit this email
- Thank You
  - This thanks the user for taking the time to express interest and allows them to be redirected to the home page.

## Technical Foundations

This static site is a react single page application started from "Create React
App". To enable the waitlist functionality, this client performs a cross origin
request to an AWS backed endpoint that stores the users email address as
appropriate.



