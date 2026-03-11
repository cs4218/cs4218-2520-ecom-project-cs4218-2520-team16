import express from "express";
import authRoutes from "../../routes/authRoute.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRoutes);
  return app;
}

function makeUrl(port, path) {
  return `http://127.0.0.1:${port}${path}`;
}

describe("Backend API integration suite without Supertest", () => {
  let server;
  let port;

  beforeAll((done) => {
    process.env.JWT_SECRET = "test-secret";

    server = makeApp().listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
      return;
    }
    done();
  });

  test("register validates required name", async () => {
    const res = await fetch(makeUrl(port, "/api/v1/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "password123",
        phone: "999",
        address: "NUS",
        answer: "blue",
      }),
    });

    const body = await res.json();
    expect(body.error).toBe("Name is Required");
  });

  test("login validates missing credentials", async () => {
    const res = await fetch(makeUrl(port, "/api/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });

    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid email or password");
  });

  test("forgot password validates missing email", async () => {
    const res = await fetch(makeUrl(port, "/api/v1/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: "blue", newPassword: "newPassword123" }),
    });

    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.message).toBe("Emai is required");
  });
});
