# CS4218 Project - Virtual Vault

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```

## CL Integration
 [LINK](https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team16/actions/runs/21854703681/job/63068917772)

## Work Allocation
Xiao Ao:
- Protected Routes
- Registration
- Login
- Admin Dashboards

Roger Yao:
- Admin Actions
- Admin View Orders
- Admin View Products
- General (1st One)

Edwin (Wen Han Tang):
- Order
- Profile
- Admin View Users
- Search

Chotaliya Aum Yogeshbhai:
- Contact
- Policy
- General (2nd One)
- Home

Wang Zihan:
- Product
- Cart
- Category
- Payment

# MS2 Work Allocation

## Xiao Ao (A0233705L)

**Integration Tests (Top-Down Approach)**
- `client/src/integration/ProductBrowsing.integration.test.js` — 20 test cases covering product listing, filtering by category/price, product details page, and category navigation
- `client/src/integration/CartManagement.integration.test.js` — 13 test cases covering add to cart from homepage, cart page display, item removal, cart persistence in localStorage, and cart cleared after payment

**UI Tests (Playwright — Black-Box Approach)**
- `playwright.config.js` — Playwright configuration (Chromium, baseURL localhost:3000)
- `tests/ui/search.spec.js` — User journey: search for a product and view its details
- `tests/ui/userProfile.spec.js` — User journey: login, update profile, and view orders

**Bug Fixes**
- `client/src/pages/Search.js` — "More Details" button had no `onClick` handler; added `useNavigate` to enable navigation to product details page (discovered via Playwright UI test)
- `client/src/pages/Search.js` — "ADD TO CART" button had no `onClick` handler; added `useCart` and `toast` to enable adding items to cart from search results
- `client/src/pages/ProductDetails.js` — Main product "ADD TO CART" button had no `onClick` handler; added `useCart` and `toast` to enable adding the product to cart
- `client/src/pages/ProductDetails.js` — Similar products "ADD TO CART" button was commented out; uncommented and wired up with cart handler

**Unit Test Updates (due to bug fixes)**
- `client/src/pages/Search.test.js` — Added mocks for `useCart` and `react-hot-toast` to reflect the bug fix in `Search.js` that introduced these dependencies
- `client/src/pages/ProductDetails.test.js` — Added mocks for `useCart` and `react-hot-toast` to reflect the bug fix in `ProductDetails.js` that introduced these dependencies

## Wen Han Tang (AA0340008W)


**1. Playwright UI Coverage Expansion**

Added new test suites:
- `tests/ui/smoke.spec.js`
- `tests/ui/navigation.spec.js`
- `tests/ui/auth.spec.js`
- `tests/ui/product-discovery.spec.js`
- `tests/ui/cart.spec.js`
- `tests/ui/admin.spec.js`
- `tests/ui/error-handling.spec.js`

Updated existing suites:
- `tests/ui/search.spec.js` (stabilized with mocked search API responses and more reliable interactions)
- `tests/ui/userProfile.spec.js` (uses env-driven credentials and skips safely if not configured)

High-level scenarios now covered include:
- smoke checks and routing
- authentication and logout flows
- product search, filtering, details, and category journeys
- cart behavior (add/remove/persist/checkout prompts)
- profile and order views
- admin dashboard actions (category/product/user/order flows)
- API/network failure resilience and 404 handling

**2. CI and Tooling Updates**

Pipeline changes in `.github/workflows/main.yml`:
- Node version updated to 20
- Playwright browsers installed in CI
- Playwright UI tests added to CI run
- Playwright report uploaded as build artifact

NPM script updates in `package.json`:
- `test` now runs backend + frontend + UI tests
- added `test:ui`, `test:ui:ci`, `test:ui:headed`, `test:ui:debug`, and `test:ui:report`

Playwright config updates in `playwright.config.js`:
- CI-aware retry behavior and reporters
- integrated `webServer` startup (`npm run dev`) for more deterministic test execution

**3. Frontend Bug Fixes from UI Testing**

`client/src/components/Form/SearchInput.js`:
- search now navigates to results reliably even when API calls fail
- fallback empty-results state applied on API failure

`client/src/components/Spinner.js`:
- redirect state normalized to `{ from: location.pathname }` for more predictable protected-route handling

**4. Documentation Update**

`UITestIdeas.md` was written to be a checklist of implemented Playwright tests

`IntegrationTestIdeas.md` was written to be a checklist of implemented integration tests

**5. Integration Testing and Reliability Fixes**

**Bugs fixed**

`jest.backend.config.js` and `package.json`:
- Fixed unreliable backend test execution mode where experimental VM modules caused runtime errors (for example, `require is not defined`)
- Added backend Jest transform configuration in `jest.backend.config.js`
- Switched npm test scripts to stable Jest CLI commands in `package.json`

`client/src/components/Layout/Header.js`:
- Fixed missing React key in the Header category dropdown list
- Added `key={c._id || c.slug}` to category items to remove warnings and improve list reconciliation stability

`client/src/hooks/useCategory.js` and `client/src/_site/hooks/useCategory.js`:
- Hardened category hook response handling so malformed or undefined responses do not create noisy runtime/test logs
- Applied the same defensive handling to both source and generated site hooks

**Integration tests written**

Backend integration suite:
- File: `integration/backend/api.integration.test.js`
- Approach: Jest + in-memory Express app + native `fetch`
- Scenarios covered:
   - register validation for missing name
   - login validation for missing credentials
   - forgot-password validation for missing email

Frontend integration suite:
- File: `client/src/integration/HeaderSearchAuth.integration.test.js`
- Approach: Jest + React Testing Library with context providers and router
- Scenarios covered:
   - auth/cart restoration from `localStorage` and logout behavior
   - search flow from Header input to API call, route navigation, and result rendering from search context

## Roger Yuzhe Yao (A0340029N)

**Integration Tests Written (Top-Down Approach)** 
Backend integration suite:
- File: `client/src/integration/CreateProduct.integration.test.js`
- 17 total tests
- Scenarios Covered:
   - Form setup and rendering 
   - File upload and preview
   - Form input and validation.

- File: `client/src/integration/UpdateProduct.integration.test.js`
- 33 total tests
- Scenarios covered:
   - Form setup and Loading
   - Form pre-population with existing data
   - photo update functionality

- File: `client/src/integration/Products.test.js`
- 21 total tests
- Scenarios covered:
   - Basic Rendering
   - Handle multiple products
   - Display product image with correct endpoint

**Bug Fixes**
- Added await to both `axios.post()` in `CreateProduct.js` and `axios.put()` in `UpdateProduct.js`
- Fixed the inverted success/error logic in both components

**Unit Test Updates**
- `AdminActions.test.js` - Updated mock responses to include `message` field, changed `mockReturnValue` to `mockResolvedValue` for async operations