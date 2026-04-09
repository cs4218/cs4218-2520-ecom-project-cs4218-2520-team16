# Spike Testing for MS3 : Xiao Ao (A0233705L)
# Spike profile: 0 -> 200 users in 10s, hold 60s, drop to 0
# Run: locust -f locustfile.py --host=http://localhost:6060
# Code Guided with assistance from Claude Code

from locust import HttpUser, task, between


class ProductBrowsingUser(HttpUser):
    """
    Product browsing spike test scenarios.
    Simulates users browsing the product catalog and searching.
    Xiao Ao, A0233705L
    """
    wait_time = between(1, 3)

    @task(3)
    def get_all_products(self):
        with self.client.get(
            "/api/v1/product/get-product",
            name="GET /product/get-product",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                # Verify response body has expected structure
                if not data.get("success") or "products" not in data:
                    response.failure(f"Unexpected response body: {data}")
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(3)
    def get_product_list_page1(self):
        with self.client.get(
            "/api/v1/product/product-list/1",
            name="GET /product/product-list/:page",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if not data.get("success") or "products" not in data:
                    response.failure(f"Unexpected response body: {data}")
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(2)
    def get_product_count(self):
        with self.client.get(
            "/api/v1/product/product-count",
            name="GET /product/product-count",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if not data.get("success") or "total" not in data:
                    response.failure(f"Unexpected response body: {data}")
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(2)
    def search_product(self):
        with self.client.get(
            "/api/v1/product/search/shirt",
            name="GET /product/search/:keyword",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                # Search should return a list
                if not isinstance(data, list):
                    response.failure(f"Expected list, got: {type(data).__name__}")
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(1)
    def get_categories(self):
        with self.client.get(
            "/api/v1/category/get-category",
            name="GET /category/get-category",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if not data.get("success") or "category" not in data:
                    response.failure(f"Unexpected response body: {data}")
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(2)
    def filter_products(self):
        """
        POST /product-filters — filter by category and price range.
        AI-identified bug scenario: known to produce unexpected behaviour under load.
        Xiao Ao, A0233705L
        """
        with self.client.post(
            "/api/v1/product/product-filters",
            json={
                "checked": [],       # no category filter
                "radio": [0, 9999]   # full price range
            },
            name="POST /product/product-filters",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                # Verify response has success flag and products list
                if not data.get("success"):
                    response.failure(f"success=False in response: {data}")
                elif "products" not in data:
                    response.failure(f"Missing 'products' key in response: {data}")
            else:
                response.failure(
                    f"POST /product-filters failed: status={response.status_code}, body={response.text[:200]}"
                )


class AuthAndCheckoutUser(HttpUser):
    """
    Auth and checkout spike test scenarios.
    Simulates users logging in and initiating checkout.
    """
    wait_time = between(1, 3)

    def on_start(self):
        self.token = None
        response = self.client.post(
            "/api/v1/auth/login",
            json={"email": "xa123@gmail.com", "password": "12345"},
            name="POST /auth/login",
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")

    @task(2)
    def login(self):
        self.client.post(
            "/api/v1/auth/login",
            json={"email": "xa123@gmail.com", "password": "12345"},
            name="POST /auth/login",
        )

    @task(1)
    def get_braintree_token(self):
        headers = {"Authorization": self.token} if self.token else {}
        self.client.get(
            "/api/v1/product/braintree/token",
            headers=headers,
            name="GET /braintree/token",
        )
