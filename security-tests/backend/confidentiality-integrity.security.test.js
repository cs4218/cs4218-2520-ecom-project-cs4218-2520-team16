// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import {
  registerController,
  updateProfileController,
} from "../../controllers/authController.js";
import {
  productListController,
  searchProductController,
} from "../../controllers/productController.js";
import userModel from "../../models/userModel.js";
import productModel from "../../models/productModel.js";
import { hashPassword } from "../../helpers/authHelper.js";

jest.mock("../../models/userModel.js");
jest.mock("../../models/productModel.js");
jest.mock("../../helpers/authHelper.js");
jest.mock("braintree", () => ({
  Environment: { Sandbox: "Sandbox" },
  BraintreeGateway: jest.fn(() => ({
    transaction: { sale: jest.fn() },
    clientToken: { generate: jest.fn() },
  })),
}));

const makeResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Confidentiality, integrity, and error-handling security tests", () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  test("registration hashes the password before persisting user data", async () => {
    // arrange
    let capturedPayload;
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed-password");
    userModel.mockImplementation((payload) => {
      capturedPayload = payload;
      return {
        save: jest.fn().mockResolvedValue({
          _id: "u-1",
          ...payload,
        }),
      };
    });

    const req = {
      body: {
        name: "test_user",
        email: "testuser@test.com",
        password: "the_password",
        phone: "23456789",
        address: "NUS",
        answer: "basketball",
      },
    };
    const res = makeResponse();

    // act
    await registerController(req, res);

    // assert
    expect(hashPassword).toHaveBeenCalledWith("the_password");
    expect(capturedPayload.password).toBe("hashed-password");
    expect(capturedPayload.password).not.toBe("the_password");
  });

  test("registration responses do not leak password hashes or security answers", async () => {
    // arrange
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed-password");
    userModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({
        _id: "testuser",
        name: "test_user",
        email: "testuser@test.com",
        password: "hashed-password",
        phone: "23456789",
        address: "NUS",
        answer: "basketball",
      }),
    }));

    const req = {
      body: {
        name: "test_user",
        email: "testuser@test.com",
        password: "the_password",
        phone: "23456789",
        address: "NUS",
        answer: "basketball",
      },
    };
    const res = makeResponse();

    // act
    await registerController(req, res);
    const responseBody = res.send.mock.calls[0][0];

    // assert
    expect(responseBody.user).not.toHaveProperty("password");
    expect(responseBody.user).not.toHaveProperty("answer");
  });

  test("profile update responses do not leak password hashes or security answers", async () => {
    // arrange
    userModel.findById.mockResolvedValue({
      _id: "testuser",
      name: "test_user",
      password: "hashed-password",
      phone: "23456789",
      address: "NUS",
      answer: "basketball",
    });
    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: "testuser",
      name: "test_user",
      password: "hashed-password",
      phone: "98765432",
      address: "NUS",
      answer: "basketball",
    });

    const req = {
      user: { _id: "testuser" },
      body: {
        phone: "98765432",
      },
    };
    const res = makeResponse();

    // act
    await updateProfileController(req, res);
    const responseBody = res.send.mock.calls[0][0];

    // assert
    expect(responseBody.updatedUser).not.toHaveProperty("password");
    expect(responseBody.updatedUser).not.toHaveProperty("answer");
  });

  test("registration error paths do not expose raw internal error details", async () => {
    // arrange
    userModel.findOne.mockRejectedValue(new Error("database credentials leaked"));
    const req = {
      body: {
        name: "testuser",
        email: "user@test.com",
        password: "the_password",
        phone: "98765432",
        address: "NUS",
        answer: "basketball",
      },
    };
    const res = makeResponse();

    // act
    await registerController(req, res);
    const responseBody = res.send.mock.calls[0][0];

    // assert
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBeUndefined();
    expect(JSON.stringify(responseBody)).not.toMatch(/database credentials leaked/i);
  });

  test("search escapes regex metacharacters before querying the database", async () => {
    // arrange
    const queryChain = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    productModel.find.mockReturnValue(queryChain);

    const req = {
      params: {
        keyword: "(a+)+$",
      },
    };
    const res = makeResponse();

    // act
    await searchProductController(req, res);

    // assert
    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "\\(a\\+\\)\\+\\$", $options: "i" } },
        { description: { $regex: "\\(a\\+\\)\\+\\$", $options: "i" } },
      ],
    });
    expect(queryChain.limit).toHaveBeenCalledWith(20);
  });
});
