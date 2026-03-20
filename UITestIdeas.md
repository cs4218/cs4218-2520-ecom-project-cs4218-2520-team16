Written by Wen Han Tang A0340008W with inspiration from ChatGPT
# UI Test Ideas

Use this as a living checklist for the Playwright suite. The goal is to cover the major customer and admin journeys, then add regression cases around the bugs or fragile flows you uncover.

## Setup And Infrastructure

- [ ] Add stable test data strategy for users, categories, and products.
- [ ] Decide whether UI tests run against seeded dev data, mocked APIs, or a dedicated test database.
- [ ] Add reusable Playwright helpers for login, cart setup, and route navigation.
- [ ] Add request or response mocking only for flows that are hard to make deterministic, such as Braintree.
- [ ] Add CI execution for the Playwright suite with artifact upload for traces and screenshots.

## Smoke Coverage

- [x] Home page loads and shows the main navigation. **(smoke.spec.js)**
- [x] Register page loads and all required fields are visible. **(smoke.spec.js)**
- [x] Login page loads and submission controls are visible. **(smoke.spec.js)**
- [x] Categories page loads without crashing. **(smoke.spec.js)**
- [x] Cart page loads for a guest user. **(smoke.spec.js)**
- [x] Unknown route shows the 404 page and Go Back link. **(smoke.spec.js)**

## Navigation And Layout

- [x] Header links navigate to Home, Categories, Register, Login, and Cart. **(navigation.spec.js)**
- [x] Clicking the site brand returns the user to the home page. **(navigation.spec.js)**
- [x] Footer links render and navigate correctly. **(navigation.spec.js)**
- [x] Search input is visible in the header on public pages. **(navigation.spec.js)**
- [x] Cart badge updates after cart mutations. **(navigation.spec.js)**
- [x] Responsive navbar works on a mobile viewport. **(navigation.spec.js)**

## Registration And Login

- [x] User can register with valid details and is redirected to login. **(auth.spec.js)**
- [x] Registration shows an error for duplicate email or invalid server response. **(auth.spec.js)**
- [x] Required-field validation prevents empty registration submissions. **(auth.spec.js)**
- [x] User can log in with valid credentials and is redirected correctly. **(auth.spec.js)**
- [x] Invalid login shows an error toast or visible failure message. **(auth.spec.js)**
- [ ] Login redirect preserves the originally requested protected route.
- [x] Logout clears auth state and returns the UI to the guest navigation. **(auth.spec.js)**

## Product Discovery

- [x] Home page renders product cards returned by the backend. **(product-discovery.spec.js)**
- [x] Clicking More Details opens the correct product details page. **(search.spec.js)**
- [x] Product details page renders name, price, description, and related products. **(product-discovery.spec.js)**
- [x] Category filters narrow the product list. **(product-discovery.spec.js)**
- [x] Price filters narrow the product list. **(product-discovery.spec.js)**
- [x] Reset Filters restores the unfiltered state. **(product-discovery.spec.js)**
- [x] Loadmore appends the next page of products. **(product-discovery.spec.js)**
- [x] Search returns matching products and opens the search results page. **(search.spec.js)**
- [x] Empty search results state is understandable to the user. **(product-discovery.spec.js)**

## Category Browsing

- [x] Categories page lists all available categories. **(product-discovery.spec.js)**
- [x] Clicking a category opens the matching category product page. **(product-discovery.spec.js)**
- [x] Category product page renders only products from that category. **(product-discovery.spec.js)**
- [ ] Empty category pages show a friendly fallback state.

## Cart And Checkout

- [x] Guest can add a product to cart from the home page. **(cart.spec.js)**
- [x] Guest can add a product to cart from the product details page. **(cart.spec.js)**
- [x] Cart persists across page refresh using local storage. **(cart.spec.js)**
- [x] Cart page shows correct item count and total price. **(cart.spec.js)**
- [x] User can remove an item from the cart. **(cart.spec.js)**
- [x] Guest checkout prompts the user to log in. **(cart.spec.js)**
- [x] Authenticated user without address is prompted to update address. **(cart.spec.js)**
- [ ] Authenticated user with address can reach the payment section.
- [ ] Payment flow is covered with mocked Braintree success response.
- [ ] Payment failure leaves cart intact and surfaces an error state.

## User Dashboard

- [ ] Unauthenticated user is blocked from user dashboard routes.
- [ ] Logged-in user can open the dashboard landing page.
- [x] Logged-in user can open orders page. **(userProfile.spec.js)**
- [ ] Logged-in user can open profile page.
- [x] Profile update persists and the new address is reflected in checkout. **(userProfile.spec.js)**
- [ ] Orders page handles empty and populated order history.

## Admin Dashboard

- [x] Non-admin user is blocked from admin routes. **(admin.spec.js)**
- [x] Admin can open dashboard landing page. **(admin.spec.js)**
- [x] Admin can open create category page. **(admin.spec.js)**
- [x] Admin can create a category and see it in the list. **(admin.spec.js)**
- [x] Admin can open create product page. **(admin.spec.js)**
- [x] Admin can create a product with all required fields. **(admin.spec.js)**
- [x] Admin can open product management page. **(admin.spec.js)**
- [ ] Admin can open update product page from product list.
- [ ] Admin can edit a product and see the changes reflected in the storefront.
- [x] Admin can delete a product. **(admin.spec.js)**
- [x] Admin can view users page. **(admin.spec.js)**
- [x] Admin can view and update order statuses. **(admin.spec.js)**

## Error Handling And Resilience

- [x] Product list API failure shows a resilient UI state instead of a broken page. **(error-handling.spec.js)**
- [x] Category API failure does not break navigation. **(error-handling.spec.js)**
- [x] Login API timeout or failure surfaces a visible error. **(error-handling.spec.js)**
- [x] Protected-route auth check failure redirects predictably. **(error-handling.spec.js)**
- [x] Slow network conditions do not cause duplicate submissions. **(error-handling.spec.js)**

## Accessibility And Usability

- [ ] Main pages have a visible heading structure.
- [ ] Core forms are keyboard navigable.
- [ ] Buttons and links have accessible names.
- [ ] Focus moves predictably after navigation and form submission.
- [ ] Toasts or status messages are perceivable enough for users.

## Cross-Browser And Viewport Coverage

- [ ] Run smoke flows in Chromium.
- [ ] Add Firefox coverage for the public smoke suite.
- [ ] Add WebKit coverage for the public smoke suite.
- [ ] Validate a mobile viewport for guest browsing and cart flows.
- [ ] Validate a desktop viewport for admin management flows.

## Good Candidates For Mocked Or Hybrid Tests

- [ ] Braintree token and payment submission.
- [ ] Admin order update flow if full payment setup is too expensive.
- [ ] Rare backend failure states that are hard to trigger consistently.
- [ ] Third-party image or network edge cases.

## Regression Backlog

- [ ] Add a regression UI test for each production bug that affects navigation, auth, cart, checkout, or admin workflows.
- [ ] Tag flaky or timing-sensitive tests and refactor them before enabling in CI gates.
- [ ] Periodically prune duplicate UI tests that overlap heavily with component tests.


### Notes for Team
- Tests use Playwright's built-in locators and wait strategies for stability
- Each test file is standalone and can be run independently: `npm run test:ui -- tests/ui/filename.spec.js`
- Run with `npm run test:ui:headed` to watch tests in action during development
- Tests prioritize resilience over brittle selectors - uses accessible patterns when possible