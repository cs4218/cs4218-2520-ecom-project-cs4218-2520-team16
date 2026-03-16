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

- [ ] Home page loads and shows the main navigation.
- [ ] Register page loads and all required fields are visible.
- [ ] Login page loads and submission controls are visible.
- [ ] Categories page loads without crashing.
- [ ] Cart page loads for a guest user.
- [ ] Unknown route shows the 404 page and Go Back link.

## Navigation And Layout

- [ ] Header links navigate to Home, Categories, Register, Login, and Cart.
- [ ] Clicking the site brand returns the user to the home page.
- [ ] Footer links render and navigate correctly.
- [ ] Search input is visible in the header on public pages.
- [ ] Cart badge updates after cart mutations.
- [ ] Responsive navbar works on a mobile viewport.

## Registration And Login

- [ ] User can register with valid details and is redirected to login.
- [ ] Registration shows an error for duplicate email or invalid server response.
- [ ] Required-field validation prevents empty registration submissions.
- [ ] User can log in with valid credentials and is redirected correctly.
- [ ] Invalid login shows an error toast or visible failure message.
- [ ] Login redirect preserves the originally requested protected route.
- [ ] Logout clears auth state and returns the UI to the guest navigation.

## Product Discovery

- [ ] Home page renders product cards returned by the backend.
- [ ] Clicking More Details opens the correct product details page.
- [ ] Product details page renders name, price, description, and related products.
- [ ] Category filters narrow the product list.
- [ ] Price filters narrow the product list.
- [ ] Reset Filters restores the unfiltered state.
- [ ] Loadmore appends the next page of products.
- [ ] Search returns matching products and opens the search results page.
- [ ] Empty search results state is understandable to the user.

## Category Browsing

- [ ] Categories page lists all available categories.
- [ ] Clicking a category opens the matching category product page.
- [ ] Category product page renders only products from that category.
- [ ] Empty category pages show a friendly fallback state.

## Cart And Checkout

- [ ] Guest can add a product to cart from the home page.
- [ ] Guest can add a product to cart from the product details page.
- [ ] Cart persists across page refresh using local storage.
- [ ] Cart page shows correct item count and total price.
- [ ] User can remove an item from the cart.
- [ ] Guest checkout prompts the user to log in.
- [ ] Authenticated user without address is prompted to update address.
- [ ] Authenticated user with address can reach the payment section.
- [ ] Payment flow is covered with mocked Braintree success response.
- [ ] Payment failure leaves cart intact and surfaces an error state.

## User Dashboard

- [ ] Unauthenticated user is blocked from user dashboard routes.
- [ ] Logged-in user can open the dashboard landing page.
- [ ] Logged-in user can open orders page.
- [ ] Logged-in user can open profile page.
- [ ] Profile update persists and the new address is reflected in checkout.
- [ ] Orders page handles empty and populated order history.

## Admin Dashboard

- [ ] Non-admin user is blocked from admin routes.
- [ ] Admin can open dashboard landing page.
- [ ] Admin can open create category page.
- [ ] Admin can create a category and see it in the list.
- [ ] Admin can open create product page.
- [ ] Admin can create a product with all required fields.
- [ ] Admin can open product management page.
- [ ] Admin can open update product page from product list.
- [ ] Admin can edit a product and see the changes reflected in the storefront.
- [ ] Admin can delete a product.
- [ ] Admin can view users page.
- [ ] Admin can view and update order statuses.

## Error Handling And Resilience

- [ ] Product list API failure shows a resilient UI state instead of a broken page.
- [ ] Category API failure does not break navigation.
- [ ] Login API timeout or failure surfaces a visible error.
- [ ] Protected-route auth check failure redirects predictably.
- [ ] Slow network conditions do not cause duplicate submissions.

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