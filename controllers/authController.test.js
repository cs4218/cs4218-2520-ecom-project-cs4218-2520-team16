// Xiao Ao, A0273305L
// Code guided by github Copilot
import {
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
  testController
} from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("Auth Controller Comprehensive Backend Tests", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        name: "Xiao Ao",
        email: "xiao@nus.edu.sg",
        password: "password123",
        phone: "91234567",
        address: "NUS",
        answer: "Blue",
      },
      user: { _id: "user123" },
      params: { orderId: "order123" }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  
  describe("registerController", () => {
    test("should fail if name is missing", async () => {
      // Arrange
      req.body.name = "";

      // Act
      await registerController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test("should fail if email is missing", async () => {
      // Arrange
      req.body.email = "";
      
      // Act
      await registerController(req, res);
      
      // Assert
      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    test("should fail if password is missing", async () => {
      // Arrange
      req.body.password = "";

      // Act
      await registerController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
    });

    test("should fail if phone is missing", async () => {
      // Arrange
      req.body.phone = "";

      // Act
      await registerController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
    });

    test("should fail if address is missing", async () => {
      // Arrange
      req.body.address = "";
      
      // Act
      await registerController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
    });

    test("should fail if answer is missing", async () => {
      // Arrange
      req.body.answer = "";

      // Act
      await registerController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
    });

    test("should fail if user already exists", async () => {
      // Arrange
      userModel.findOne.mockResolvedValue({ email: "xiao@nus.edu.sg" });

      // Act
      await registerController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login"
      });
    });

    test("should successfully register a new user", async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashedPassword123");
      const mockSave = jest.fn().mockResolvedValue({
        _id: "newUser123",
        name: "Xiao Ao",
        email: "xiao@nus.edu.sg"
      });
      userModel.mockImplementation(() => ({
        save: mockSave
      }));
      
      // Act
      await registerController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "User Register Successfully"
        })
      );
    });

    test("should handle registration error", async () => {
      // Arrange
      userModel.findOne.mockRejectedValue(new Error("DB Error"));
      
      // Act
      await registerController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Errro in Registeration"
        })
      );
    });
  });


  describe("loginController", () => {
    test("should fail if email or password is missing", async () => {
      // Arrange
      req.body.email = "";

      // Act
      await loginController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password"
      });
    });

    test("should fail if user not found", async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);

      // Act
      await loginController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd"
      });
    });

    test("should fail with wrong password", async () => {
      // Arrange
      userModel.findOne.mockResolvedValue({ 
        _id: "user123",
        password: "hashed" 
      });
      comparePassword.mockResolvedValue(false);

      // Act
      await loginController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password"
      });
    });

    test("should successfully login", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "Xiao Ao",
        email: "xiao@nus.edu.sg",
        phone: "91234567",
        address: "NUS",
        role: 0,
        password: "hashed"
      };
      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("token123");
      
      // Act
      await loginController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "login successfully",
          token: "token123"
        })
      );
    });

    test("should handle login error", async () => {
      // Arrange
      userModel.findOne.mockRejectedValue(new Error("DB Error"));

      // Act
      await loginController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in login"
        })
      );
    });
  });


  describe("forgotPasswordController", () => {
    test("should fail if email is missing", async () => {
      // Arrange
      req.body.email = "";

      // Act
      await forgotPasswordController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Emai is required" });
    });

    test("should fail if answer is missing", async () => {
      // Arrange
      req.body.answer = "";

      // Act
      await forgotPasswordController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "answer is required" });
    });

    test("should fail if newPassword is missing", async () => {
      // Arrange
      req.body.newPassword = "";

      // Act
      await forgotPasswordController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
    });

    test("should fail if user not found with email/answer", async () => {
      // Arrange
      req.body.newPassword = "newPassword123";
      userModel.findOne.mockResolvedValue(null);

      // Act
      await forgotPasswordController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Wrong Email Or Answer"
      });
    });

    test("should successfully reset password", async () => {
      // Arrange
      req.body.newPassword = "newPassword123";
      userModel.findOne.mockResolvedValue({ _id: "user123" });
      hashPassword.mockResolvedValue("hashedNewPassword");
      userModel.findByIdAndUpdate.mockResolvedValue({ _id: "user123" });
      
      // Act
      await forgotPasswordController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully"
      });
    });

    test("should handle error in forgotPasswordController", async () => {
      // Arrange
      req.body.newPassword = "newPassword123";
      userModel.findOne.mockRejectedValue(new Error("DB Crash"));

      // Act
      await forgotPasswordController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Something went wrong" })
      );
    });
  });


  describe("updateProfileController", () => {
    test("should fail if password is too short", async () => {
      // Arrange
      req.body.password = "123";
      userModel.findById.mockResolvedValue({ name: "Xiao Ao" });

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ 
        error: "Passsword is required and 6 character long" 
      });
    });

    test("should successfully update profile with all fields", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "Old Name",
        phone: "91234567",
        address: "NUS"
      };
      req.body = {
        name: "New Name",
        email: "new@nus.edu.sg",
        password: "newpassword123",
        phone: "98765432",
        address: "New Address"
      };
      userModel.findById.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue("hashedPassword");
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        name: "New Name",
        phone: "98765432",
        address: "New Address"
      });
      
      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile Updated SUccessfully"
        })
      );
    });

    test("should successfully update profile with partial fields", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "Xiao Ao",
        phone: "91234567",
        address: "NUS"
      };
      req.body = {
        name: "Xiao Ao",
        phone: undefined,
        address: undefined
      };
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser
      });

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile Updated SUccessfully"
        })
      );
    });

    test("should keep existing password if not provided and use OR operator", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "Xiao Ao",
        phone: "91234567",
        address: "NUS",
        password: "existingHash"
      };
      req.body = {
        name: "Xiao Ao",
        email: "test@test.com",
        password: undefined,
        phone: "91234567",
        address: "NUS"
      };
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser
      });
      
      // Act
      await updateProfileController(req, res);
      const callArgs = userModel.findByIdAndUpdate.mock.calls[0];

      // Assert
      expect(callArgs[1].password).toBe("existingHash");
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile Updated SUccessfully"
        })
      );
    });
    test("should hash password when provided and use hashed value", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "Xiao Ao",
        phone: "91234567",
        address: "NUS",
        password: "oldHash"
      };
      req.body = {
        name: "Xiao Ao",
        email: "test@test.com",
        password: "newPassword123",
        phone: "91234567",
        address: "NUS"
      };
      userModel.findById.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue("newHashedPassword");
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        password: "newHashedPassword"
      });
      
      // Act
      await updateProfileController(req, res);
      
      // Assert
      expect(hashPassword).toHaveBeenCalledWith("newPassword123");
      
      const callArgs = userModel.findByIdAndUpdate.mock.calls[0];
      expect(callArgs[1].password).toBe("newHashedPassword");
      
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should use all OR operators with existing user values", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        name: "ExistingName",
        phone: "91234567",
        address: "ExistingAddress",
        password: "existingHash"
      };
      req.body = {
        name: undefined,
        email: "test@test.com",
        password: undefined,
        phone: undefined,
        address: undefined
      };
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);
      
      // Act
      await updateProfileController(req, res);
      
      // Assert
      const callArgs = userModel.findByIdAndUpdate.mock.calls[0];
      expect(callArgs[1]).toEqual({
        name: "ExistingName",
        password: "existingHash",
        phone: "91234567",
        address: "ExistingAddress"
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("should handle error in updateProfileController", async () => {
      // Arrange
      userModel.findById.mockRejectedValue(new Error("DB Error"));

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Update profile"
        })
      );
    });
  });

  describe("getOrdersController", () => {
    test("should return orders for user", async () => {
      // Arrange
      const mockOrders = [{ _id: "o1", buyer: "user123" }];
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
      };
      
      const firstPopulate = mockChain.populate.mockReturnValueOnce(mockChain);
      mockChain.populate.mockReturnValueOnce(Promise.resolve(mockOrders));
      orderModel.find.mockReturnValue(mockChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should handle error in getOrdersController", async () => {
      // Arrange
      const mockChain = {
        populate: jest.fn().mockReturnThis()
      };
      mockChain.populate.mockReturnValueOnce(mockChain);
      mockChain.populate.mockReturnValueOnce(Promise.reject(new Error("DB Error")));
      orderModel.find.mockReturnValue(mockChain);
      
      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders"
        })
      );
    });
  });

  describe("getAllOrdersController", () => {
    test("should fetch all orders and sort", async () => {
      // Arrange
      const mockOrders = [{ _id: "o1" }, { _id: "o2" }];
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockOrders)
      };
      mockChain.populate.mockReturnValueOnce(mockChain);
      mockChain.populate.mockReturnValueOnce(mockChain);
      orderModel.find.mockReturnValue(mockChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should handle error in getAllOrdersController", async () => {
      // Arrange
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error("DB Error"))
      };
      mockChain.populate.mockReturnValueOnce(mockChain);
      mockChain.populate.mockReturnValueOnce(mockChain);
      orderModel.find.mockReturnValue(mockChain);
      
      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders"
        })
      );
    });
  });

  describe("orderStatusController", () => {
    test("should update order status", async () => {
      // Arrange
      const mockOrder = { _id: "order123", status: "Shipped" };
      orderModel.findByIdAndUpdate.mockResolvedValue(mockOrder);
      req.body.status = "Shipped";

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    test("should handle error in orderStatusController", async () => {
      // Arrange
      orderModel.findByIdAndUpdate.mockRejectedValue(new Error("DB Error"));
      req.body.status = "Shipped";

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updateing Order"
        })
      );
    });
  });

  describe("testController", () => {
    test("should return protected routes", () => {
      // Act
      testController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    test("should handle error in testController", () => {
      // Arrange  
      const sendError = new Error("Send error");
      res.send.mockImplementation(() => {
        throw sendError;
      });

      // Act & Assert
      expect(() => testController(req, res)).toThrow(sendError);
    });
  });
});