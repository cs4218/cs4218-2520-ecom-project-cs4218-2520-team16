// Wen Han Tang A0340008W
import express from "express";
import authRoutes from "../../routes/authRoute.js";
import userModel from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";
import { comparePassword, hashPassword } from "../../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../../models/userModel.js");
jest.mock("../../models/orderModel.js");
jest.mock("../../helpers/authHelper.js");
jest.mock("jsonwebtoken");

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

  beforeEach(() => {
    jest.clearAllMocks();
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

  test("register succeeds with valid payload", async () => {
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed-password");
    userModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({
        _id: "u-1",
        name: "Alice",
        email: "alice@example.com",
        phone: "999",
        address: "NUS",
        role: 0,
      }),
    }));

    const res = await fetch(makeUrl(port, "/api/v1/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
        phone: "999",
        address: "NUS",
        answer: "blue",
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.user.email).toBe("alice@example.com");
  });

  test("register duplicate email returns fail response", async () => {
    userModel.findOne.mockResolvedValue({ _id: "existing-user" });

    const res = await fetch(makeUrl(port, "/api/v1/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
        phone: "999",
        address: "NUS",
        answer: "blue",
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Already Register please login");
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

  test("login succeeds and returns token", async () => {
    userModel.findOne.mockResolvedValue({
      _id: "u-1",
      name: "Alice",
      email: "alice@example.com",
      phone: "999",
      address: "NUS",
      role: 0,
      password: "hashed-password",
    });
    comparePassword.mockResolvedValue(true);
    JWT.sign.mockReturnValue("token-123");

    const res = await fetch(makeUrl(port, "/api/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", password: "password123" }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBe("token-123");
    expect(body.user.role).toBe(0);
  });

  test("login fails with invalid password", async () => {
    userModel.findOne.mockResolvedValue({ _id: "u-1", password: "hashed-password" });
    comparePassword.mockResolvedValue(false);

    const res = await fetch(makeUrl(port, "/api/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", password: "wrong-password" }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid Password");
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

  test("forgot password succeeds with valid answer", async () => {
    userModel.findOne.mockResolvedValue({ _id: "u-1" });
    hashPassword.mockResolvedValue("new-hashed");
    userModel.findByIdAndUpdate.mockResolvedValue({ _id: "u-1" });

    const res = await fetch(makeUrl(port, "/api/v1/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        answer: "blue",
        newPassword: "newPassword123",
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Password Reset Successfully");
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("u-1", {
      password: "new-hashed",
    });
  });

  test("user-auth returns 401 without token", async () => {
    const res = await fetch(makeUrl(port, "/api/v1/auth/user-auth"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  test("user-auth returns 200 with valid token", async () => {
    JWT.verify.mockReturnValue({ _id: "u-1" });

    const res = await fetch(makeUrl(port, "/api/v1/auth/user-auth"), {
      headers: { authorization: "valid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  test("admin-auth denies non-admin users", async () => {
    JWT.verify.mockReturnValue({ _id: "u-1" });
    userModel.findById.mockResolvedValue({ _id: "u-1", role: 0 });

    const res = await fetch(makeUrl(port, "/api/v1/auth/admin-auth"), {
      headers: { authorization: "valid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe("UnAuthorized Access");
  });

  test("admin-auth allows admin users", async () => {
    JWT.verify.mockReturnValue({ _id: "admin-1" });
    userModel.findById.mockResolvedValue({ _id: "admin-1", role: 1 });

    const res = await fetch(makeUrl(port, "/api/v1/auth/admin-auth"), {
      headers: { authorization: "valid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  test("profile update persists changed fields", async () => {
    JWT.verify.mockReturnValue({ _id: "u-1" });
    userModel.findById.mockResolvedValue({
      _id: "u-1",
      name: "Alice",
      password: "hashed",
      phone: "111",
      address: "Old",
    });
    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: "u-1",
      name: "Alice Updated",
      phone: "999",
      address: "NUS",
    });

    const res = await fetch(makeUrl(port, "/api/v1/auth/profile"), {
      method: "PUT",
      headers: {
        authorization: "valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Alice Updated", phone: "999", address: "NUS" }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.updatedUser.name).toBe("Alice Updated");
  });

  test("orders returns authenticated user orders", async () => {
    JWT.verify.mockReturnValue({ _id: "u-1" });
    const ordersPayload = [{ _id: "o-1", buyer: { _id: "u-1", name: "Alice" } }];
    const populateBuyer = jest.fn().mockResolvedValue(ordersPayload);
    const populateProducts = jest.fn().mockReturnValue({ populate: populateBuyer });
    orderModel.find.mockReturnValue({ populate: populateProducts });

    const res = await fetch(makeUrl(port, "/api/v1/auth/orders"), {
      headers: { authorization: "valid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "u-1" });
    expect(body).toHaveLength(1);
    expect(body[0]._id).toBe("o-1");
  });

  test("all-orders allows admin and returns sorted orders", async () => {
    JWT.verify.mockReturnValue({ _id: "admin-1" });
    userModel.findById.mockResolvedValue({ _id: "admin-1", role: 1 });

    const ordersPayload = [{ _id: "o-2" }, { _id: "o-1" }];
    const sort = jest.fn().mockResolvedValue(ordersPayload);
    const populateBuyer = jest.fn().mockReturnValue({ sort });
    const populateProducts = jest.fn().mockReturnValue({ populate: populateBuyer });
    orderModel.find.mockReturnValue({ populate: populateProducts });

    const res = await fetch(makeUrl(port, "/api/v1/auth/all-orders"), {
      headers: { authorization: "valid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(body).toHaveLength(2);
    expect(sort).toHaveBeenCalledWith({ createdAt: "-1" });
  });
});
