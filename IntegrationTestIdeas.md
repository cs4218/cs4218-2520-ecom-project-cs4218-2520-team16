# Integration Tests for E-Commerce Project

Written by Wen Han Tang A0340008W with inspiration from ChatGPT

## **1. AUTHENTICATION & USER MANAGEMENT**

### User Registration Flow
- [x] New user registration with valid data → user created in DB → can login
- [x] Register with duplicate email → error response → user not created
- [x] Register with missing required fields → validation error
- [ ] Register with invalid email format → validation error
- [ ] Register with weak password → validation error
- [ ] Registered user data persisted correctly (name, email, phone, address, role=0)

### Login Flow
- [x] Valid credentials → JWT token returned → stored in localStorage
- [x] Invalid email → login fails with appropriate error
- [x] Invalid password → login fails with appropriate error
- [ ] Login → auth context updated → axios Authorization header set

### Protected Routes
- [x] Unauthenticated user cannot access `/dashboard/user/*`
- [x] Unauthenticated user cannot access `/dashboard/admin/*`
- [x] GET `/api/v1/auth/user-auth` with valid token → returns 200
- [x] GET `/api/v1/auth/user-auth` with invalid/no token → returns 401
- [x] GET `/api/v1/auth/admin-auth` with admin user → returns 200
- [x] GET `/api/v1/auth/admin-auth` with non-admin user → returns 401

### Profile Management
- [x] User updates profile (name, email, phone, address) → API call succeeds → data persists
- [ ] User changes password → password updated in DB (hashed)
- [ ] Profile update with invalid/missing fields → validation error
- [ ] Updated user info reflects in Header component immediately

### Password Reset
- [ ] User provides security question answer → gets reset capability
- [x] Reset with correct answer → password reset succeeds
- [ ] Reset with incorrect answer → error response

---

## **2. PRODUCT BROWSING & FILTERING**

### HomePage & Pagination
- [x] HomePage loads → GET `/api/v1/product/product-list/1` called
- [x] Product count fetched → GET `/api/v1/product/product-count`

### Filtering
- [x] Select single category → POST `/api/v1/product/product-filters` with correct payload
- [x] Select multiple categories → filters by all selected categories
- [x] Select price range → filters by price (e.g., 100-500)
- [x] Select category + price range → combines both filters
- [x] Reset filters → all products shown again
- [x] Filter results count matches API response

### Product Details Page
- [x] Navigate to product via slug → GET `/api/v1/product/get-product/{slug}` called
- [x] Product name, description, price, category displayed correctly
- [x] Product photo loads from → GET `/api/v1/product/product-photo/{productId}`
- [x] Related products fetched → GET `/api/v1/product/related-product/{pid}/{cid}`
- [x] Related products are in same category as current product
- [x] Related products exclude the current product itself
- [x] Max 3 related products shown

### Category Navigation
- [x] Header loads → GET `/api/v1/category/get-category` called
- [x] Categories dropdown populated
- [x] Clicking category → navigates to `/category/{slug}`
- [x] CategoryProduct page → GET `/api/v1/product/product-category/{slug}`
- [x] Only products in that category displayed
- [x] Category name and product count shown

---

## **3. CART MANAGEMENT**

### Cart Context Persistence
- [x] Add product to cart → item appears in cart context
- [x] Cart saved to localStorage key "cart"
- [x] Page refresh → cart persists from localStorage
- [x] Add multiple products → all preserved in cart
- [x] Add same product twice → quantity increases OR duplicate items shown (verify behavior)

### Cart Operations
- [x] Remove item from CartPage → item removed from context + localStorage
- [x] Clear cart after successful purchase → localStorage "cart" emptied
- [x] Cart badge in Header shows correct item count
- [x] Cart updates are immediately reflected in Header badge
- [x] Cart total price calculated correctly

### Cart Display
- [x] CartPage displays all cart items with photo, name, description, price
- [x] Product photo loads correctly for each cart item
- [x] Remove button removes specific item only
- [x] Cart total updates when items removed

---

## **4. SEARCH FUNCTIONALITY**

### Search Workflow
- [x] Type keyword in SearchInput → keyword set in search context
- [x] Submit search → GET `/api/v1/product/search/{keyword}` called
- [ ] Search case-insensitive → "iPhone" finds products with "iphone"
- [ ] Search by product name → matching products returned
- [ ] Search by description keywords → matching products found
- [x] Navigate to Search page → results display from context
- [x] Display result count (e.g., "3 results found")
- [ ] Empty search → returns all products OR error message

### Search Persistence
- [x] Results persist in context after navigation to Search page
- [ ] Clearing search or navigating away → context results cleared
- [ ] New search replaces previous results

---

## **5. CHECKOUT & PAYMENT**

### Pre-Checkout Validation
- [x] Unauthenticated user clicks checkout → shown login prompt or redirected to login
- [x] Authenticated user can proceed to checkout
- [x] Cart has items before payment → checkout button enabled
- [x] Empty cart → checkout disabled or error

### Braintree Integration
- [x] CartPage checkout → GET `/api/v1/product/braintree/token` called
- [x] Braintree DropIn UI renders with valid token
- [x] User enters payment details in DropIn UI
- [x] Submission calls POST `/api/v1/product/braintree/payment`
- [x] Nonce from Braintree UI included in payment request
- [x] Payment payload includes cart items and user info

### Payment Processing
- [x] Valid payment → HTTP 200 response
- [x] Payment data stored in Order.payment field
- [x] Order created in DB with:
  - buyer ID
  - products array
  - payment object from Braintree
  - status = "Not Process"
- [x] Invalid payment → error response + order not created
- [x] Failed payment → cart not cleared

### Post-Purchase
- [x] Successful payment → cart cleared from context + localStorage
- [x] Redirect to `/dashboard/user/orders` → user's orders page loads
- [x] Success toast/message shown
- [x] New order appears in user's orders list

---

## **6. ORDER MANAGEMENT**

### User Orders
- [x] User dashboard Orders tab → GET `/api/v1/auth/orders` called
- [ ] Orders displayed with: ID, status, buyer, date, payment success, quantity
- [ ] Order products populated correctly (not just IDs)
- [ ] Product photo loads for each item in order
- [ ] Dates formatted with moment.js (relative format)
- [x] Only user's own orders displayed

### Admin Orders
- [x] Admin Orders page → GET `/api/v1/auth/all-orders` called
- [x] All orders from all users displayed
- [ ] Each order shows all needed info (buyer name, products, etc.)
- [ ] Status dropdown available for each order (Not Process → Processing → Shipped → deliverd)
- [ ] Order status change → PUT `/api/v1/auth/order-status/{orderId}` called
- [ ] Status update persists → refreshing page shows new status
- [ ] Admin cannot edit orders they shouldn't (permissions enforced)

### Order Status Workflow
- [ ] New order → initial status "Not Process"
- [ ] Admin changes status → PUT request with new status
- [ ] Status changed to "deliverd" → order marked as complete
- [ ] Can move backwards through statuses (or verify if restricted)

---

## **7. ADMIN PRODUCT MANAGEMENT**

### Create Product
- [ ] Non-admin cannot access `/dashboard/admin/create-product`
- [ ] Admin CreateProduct form loads
- [ ] Category dropdown populated from → GET `/api/v1/category/get-category`
- [ ] File upload adds product photo with preview
- [ ] Submit form → POST `/api/v1/product/create-product` with FormData
- [ ] Product created with:
  - name (converted to slug)
  - description
  - price
  - quantity
  - category reference
  - photo (as Buffer)
  - shipping boolean
- [ ] Redirect to products list on success
- [ ] Error toast on failed creation

### Update Product
- [ ] Admin navigates to UpdateProduct with `:slug`
- [ ] GET `/api/v1/product/get-product/{slug}` → form pre-populated
- [ ] All fields show existing data
- [ ] Can update name → slug regenerated
- [ ] Can update category
- [ ] Can replace photo OR keep existing
- [ ] Submit → PUT `/api/v1/product/update-product/{pid}` with FormData
- [ ] Product updated in DB
- [ ] Redirect to products list
- [ ] Updated product appears in product list
- [ ] Updated photo loads correctly

### View Products List
- [ ] Admin Products page → GET `/api/v1/product/get-product` returns all products
- [ ] Products displayed as grid with photo, name, description
- [ ] Clicking product card → navigates to UpdateProduct page
- [ ] Product photos load correctly

### Delete Product
- [ ] Admin can delete product → DELETE `/api/v1/product/delete-product/{pid}`
- [ ] Product removed from DB
- [ ] Product removed from all product lists
- [ ] Related products no longer reference deleted product

---

## **8. CATEGORY MANAGEMENT**

### Create Category
- [ ] Admin CreateCategory page loads
- [ ] Existing categories listed
- [ ] Submit category name → POST `/api/v1/category/create-category`
- [ ] Category created with:
  - name
  - slug (generated from name)
- [ ] New category appears in categories list immediately
- [ ] New category available in product creation dropdown

### Update Category
- [ ] Admin can update category name → PUT `/api/v1/category/update-category/{id}`
- [ ] Slug regenerated if name changes
- [ ] Products assigned to category still reference it

### Delete Category
- [ ] Admin can delete category → DELETE `/api/v1/category/delete-category/{id}`
- [ ] Category removed from system
- [ ] Products assigned to deleted category handled correctly
  - Verify if products are orphaned, cascaded, or reassigned

### Category Usage
- [ ] Category appears in Header dropdown
- [ ] Category available when filtering on HomePage
- [ ] Products can be filtered by category

---

## **9. CROSS-COMPONENT INTERACTIONS**

### Header Component Integration
- [ ] Header displays auth status (logged out vs. logged in)
- [x] Cart badge shows item count from cart context
- [ ] Categories dropdown loads categories and links work
- [x] SearchInput submits search correctly
- [x] User dropdown shows current user from auth context
- [x] Logout clears auth context + localStorage
- [ ] After logout → redirects to home → cannot access protected pages

### Layout Component
- [ ] Helmet meta tags updated for each page (title, description, keywords)
- [ ] Toast notifications appear and dismiss
- [ ] Header and Footer included on all pages

### Footer Component
- [ ] Footer displays on all pages
- [ ] Footer links functional (if any)

---

## **10. EDGE CASES & ERROR HANDLING**

### Network/API Errors
- [ ] API timeout → error message shown → page doesn't break
- [ ] 500 server error → error toast displayed
- [ ] 404 not found → appropriate page or error shown
- [ ] Concurrent API calls handled correctly (race conditions avoided)

### State Management Edge Cases
- [ ] Rapidly toggling cart items → final state correct
- [ ] Multiple filter selections → correct combined filtering
- [ ] Search while filtering products → search takes precedence
- [ ] Cart updates while processing payment → no data loss

### Session & Persistence
- [ ] Open multiple tabs → auth/cart synced across tabs (or at least not conflicting)
- [ ] Browser close/reopen → auth and cart restored from localStorage
- [ ] Clear browser cache → session lost, reauthentication required

### Data Validation
- [ ] Product price negative or zero → validation error
- [ ] Product quantity negative → validation error
- [ ] Email validation → proper format required
- [ ] Phone number validation (if any)

---

## **11. USER JOURNEY TESTS** (End-to-End Scenarios)

### Complete Purchase Journey
1. New user registers
2. Browses products (filters by category)
3. Views product details
4. Searches for specific product
5. Adds multiple items to cart
6. Cart persists after page refresh
7. Goes to checkout
8. Completes payment via Braintree
9. Order created and visible in user orders
10. Logs out and logs back in
11. Previous order still visible

### Admin Product Lifecycle
1. Admin creates category
2. Admin creates product with photo
3. Product appears in public catalog
4. Admin updates product price
5. Updated price reflects in store
6. Customer purchases product
7. Admin views order and updates status
8. Admin deletes product
9. Product no longer available for purchase

### Filter & Search Integration
1. User applies category filter
2. Products filtered correctly
3. User searches within filtered results
4. Search takes precedence or combines
5. User resets filters
6. All products shown again

---

## **Testing Strategy Recommendations**

### Test Stack Suggestions
- **Frontend Integration**: React Testing Library + Mock API responses
- **Backend Integration**: Jest + Supertest + MongoDB test database
- **E2E Tests**: Playwright (you already have it configured)
- **Test Database**: MongoDB test instance (separate from dev/prod)

### Key Areas to Focus
1. **Payment flow** - most critical for revenue
2. **Auth middleware** - security critical
3. **Cart persistence** - UX critical
4. **Product filtering** - core feature
5. **Order creation from payment** - data integrity

### Avoid Testing
- Individual component rendering (use unit tests)
- Braintree SDK internals (mock them)
- Third-party libraries (assume they work)

---

## **Integration Test Implementation Notes**

### Frontend Tests (React Testing Library)
- Mock axios responses using jest.mock()
- Use `waitFor()` for async operations
- Test user interactions (clicks, form submissions, navigation)
- Verify context state updates after API calls
- Check localStorage reads/writes

### Backend Tests (Jest + Supertest)
- Use test database (separate from production)
- Create fixtures for test data
- Clean up DB between test runs
- Test middleware chain (auth → controller)
- Verify error responses with appropriate status codes

### E2E Tests (Playwright)
- Use Playwright config already in your project
- Test complete user journeys
- Verify page navigation and redirects
- Check DOM state updates after user actions
- Test across different screen sizes

### Database Cleanup Strategy
- Use `beforeEach()` to reset DB state
- Use transaction rollbacks for isolation
- Seed test data as needed per test
- `afterAll()` cleanup of test users/products

### Mocking Strategy
- Mock Braintree SDK for payment tests
- Mock file uploads for product photo tests
- Mock external APIs (if any)
- Real API calls only for core integration tests
