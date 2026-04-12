// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import authRoutes from "../../routes/authRoute.js";
import productRoutes from "../../routes/productRoutes.js";
import userModel from "../../models/userModel.js";
import productModel from "../../models/productModel.js";
import { comparePassword, hashPassword } from "../../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../../models/userModel.js");
jest.mock("../../models/productModel.js");
jest.mock("../../helpers/authHelper.js");
jest.mock("jsonwebtoken");
jest.mock("braintree", () => ({
  Environment: { Sandbox: "Sandbox" },
  BraintreeGateway: jest.fn(() => ({
    transaction: { sale: jest.fn() },
    clientToken: { generate: jest.fn() },
  })),
}));

const dispatchRouteRequest = ({ router, method, url, body, headers = {} }) =>
  new Promise((resolve, reject) => {
    let resolved = false;

    const req = {
      method,
      url,
      body,
      headers,
      originalUrl: url,
    };

    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      finished: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      set(name, value) {
        this.headers[name.toLowerCase()] = value;
        return this;
      },
      send(payload) {
        this.finished = true;
        this.body = payload;
        resolved = true;
        resolve({ req, res: this });
        return this;
      },
      json(payload) {
        this.finished = true;
        this.body = payload;
        resolved = true;
        resolve({ req, res: this });
        return this;
      },
      redirect(statusOrUrl, maybeUrl) {
        this.finished = true;
        this.statusCode = typeof statusOrUrl === "number" ? statusOrUrl : 302;
        this.headers.location =
          typeof statusOrUrl === "number" ? maybeUrl : statusOrUrl;
        resolved = true;
        resolve({ req, res: this });
        return this;
      },
    };

    router.handle(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      if (!resolved) {
        res.statusCode = 404;
        res.body = { success: false, message: "Not Found" };
        resolve({ req, res });
      }
    });
  });

describe("Authentication, authorization, transport, and active attack tests", () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    process.env.JWT_SECRET = "security-suite-secret";
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  test("protected routes reject invalid tokens with a generic error message", async () => {
    // arrange
    JWT.verify.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    // act
    const { res } = await dispatchRouteRequest({
      router: authRoutes,
      method: "GET",
      url: "/user-auth",
      headers: { authorization: "not-a-real-token" },
    });

    // assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid or expired token");
    expect(JSON.stringify(res.body)).not.toMatch("jwt malformed");
  });

  test("verb tampering does not allow GET on the login endpoint", async () => {
    // arrange
    const request = {
      router: authRoutes,
      method: "GET",
      url: "/login",
    };

    // act
    const { res } = await dispatchRouteRequest(request);

    // assert
    expect(res.statusCode).toBe(404);
  });

  test("classic SQL injection payloads do not bypass authentication", async () => {
    // arrange
    userModel.findOne.mockResolvedValue(null);

    // act
    const { res } = await dispatchRouteRequest({
      router: authRoutes,
      method: "POST",
      url: "/login",
      body: {
        email: "' OR '1'='1",
        password: "' OR '1'='1",
      },
      headers: { "content-type": "application/json" },
    });

    // assert
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email is not registerd");
    expect(comparePassword).not.toHaveBeenCalled();
  });

  test("registration enforces a weak-password policy", async () => {
    // arrange
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed-weak-password");
    userModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({
        _id: "weakuser",
        name: "Weak User",
        email: "weak@example.com",
        password: "hashed-weak-password",
        answer: "basketball",
      }),
    }));

    // act
    const { res } = await dispatchRouteRequest({
      router: authRoutes,
      method: "POST",
      url: "/register",
      body: {
        name: "Weak User",
        email: "weak@example.com",
        password: "123",
        phone: "98765432",
        address: "NUS",
        answer: "basketball",
      },
      headers: { "content-type": "application/json" },
    });

    // assert
    expect([400, 422]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
    expect(String(res.body.message || res.body.error || "")).toMatch(/password/i);
  });

  test("repeated failed logins trigger a lockout or rate limit", async () => {
    // arrange
    userModel.findOne.mockResolvedValue({
      _id: "u-1",
      password: "hashed-password",
    });
    comparePassword.mockResolvedValue(false);

    let finalResponse;

    // act
    for (let attempt = 0; attempt < 10; attempt += 1) {
      finalResponse = await dispatchRouteRequest({
        router: authRoutes,
        method: "POST",
        url: "/login",
        body: {
          email: "user@test.com",
          password: `wrong-password-${attempt}`,
        },
        headers: { "content-type": "application/json" },
      });
    }

    // assert
    expect([423, 429]).toContain(finalResponse.res.statusCode);
    expect(String(finalResponse.res.body.message || "")).toMatch(/lock|too many/i);
  });

  test("delete-product rejects unauthenticated requests", async () => {
    // arrange
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "p-1" }),
    });

    // act
    const { res } = await dispatchRouteRequest({
      router: productRoutes,
      method: "DELETE",
      url: "/delete-product/p-1",
    });

    // assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("delete-product rejects authenticated non-admin users", async () => {
    // arrange
    JWT.verify.mockReturnValue({ _id: "user-1" });
    userModel.findById.mockResolvedValue({ _id: "user-1", role: 0 });
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "p-1" }),
    });

    // act
    const { res } = await dispatchRouteRequest({
      router: productRoutes,
      method: "DELETE",
      url: "/delete-product/p-1",
      headers: { authorization: "valid-token" },
    });

    // assert
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("UnAuthorized Access");
  });
});
