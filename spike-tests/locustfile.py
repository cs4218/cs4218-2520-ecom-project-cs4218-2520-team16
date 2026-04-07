# Spike Testing for MS3 : Xiao Ao (A0233705L)
# Spike profile: 0 -> 200 users in 10s, hold 60s, drop to 0
# Run: locust -f locustfile.py --host=http://localhost:6060

from locust import HttpUser, task, between, constant


class ProductBrowsingUser(HttpUser):
    """
    Product browsing spike test scenarios.
    Simulates users browsing the product catalog and searching.
    """
    wait_time = between(1, 3)

    @task(3)
    def get_all_products(self):
        self.client.get("/api/v1/product/get-product", name="GET /product/get-product")

    @task(3)
    def get_product_list_page1(self):
        self.client.get("/api/v1/product/product-list/1", name="GET /product/product-list/:page")

    @task(2)
    def get_product_count(self):
        self.client.get("/api/v1/product/product-count", name="GET /product/product-count")

    @task(2)
    def search_product(self):
        self.client.get("/api/v1/product/search/shirt", name="GET /product/search/:keyword")

    @task(1)
    def get_categories(self):
        self.client.get("/api/v1/category/get-category", name="GET /category/get-category")


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
