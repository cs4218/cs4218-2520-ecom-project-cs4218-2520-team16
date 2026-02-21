// Written by Roger Yao with the help of Copilot

jest.mock("braintree", () => ({
  Environment: { Sandbox: "Sandbox" },
  BraintreeGateway: jest.fn(() => ({
    clientToken: { generate: jest.fn() },
    transaction: { sale: jest.fn() },
  })),
}));

import {
  createProductController,
  deleteProductController,
  updateProductController,
} from "./productController";
import productModel from "../models/productModel.js";
import fs from "fs";
import slugify from "slugify";

jest.mock("../models/productModel.js");
jest.mock("fs");
jest.mock("slugify");

describe("Admin Product Controllers", () => {
  let req;
  let res;

  const buildRes = () => ({
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  const baseFields = {
    name: "Test Product",
    description: "Desc",
    price: 10,
    category: "cat",
    quantity: 1,
    shipping: true,
  };

  beforeEach(() => {
    req = { fields: {}, files: {}, params: {} };
    res = buildRes();
    jest.clearAllMocks();
  });

  describe("createProductController", () => {
    test("should return error if name is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, name: "" };

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test("should return error if description is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, description: "" };

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
    });

    test("should return error if price is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, price: null };

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    });

    test("should return error if category is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, category: "" };

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    });

    test("should return error if quantity is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, quantity: 0 };

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
    });

    test("should return error if photo exceeds size limit", async () => {
      // Arrange
      req.fields = { ...baseFields };
      req.files = { photo: { size: 1000001 } };

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "photo is Required and should be less then 1mb",
      });
    });

    test("should create product with photo and return success", async () => {
      // Arrange
      const mockPhotoBuffer = Buffer.from("photo");
      req.fields = { ...baseFields };
      req.files = { photo: { size: 10, path: "/tmp/p.jpg", type: "image/jpeg" } };
      slugify.mockReturnValue("test-product");
      fs.readFileSync.mockReturnValue(mockPhotoBuffer);
      const save = jest.fn().mockResolvedValue(true);
      productModel.mockImplementation(() => ({
        photo: { data: null, contentType: null },
        save,
      }));

      // Act
      await createProductController(req, res);

      // Assert
      expect(slugify).toHaveBeenCalledWith("Test Product");
      expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p.jpg");
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Created Successfully",
        })
      );
    });

    test("should create product without photo and return success", async () => {
      // Arrange
      req.fields = { ...baseFields };
      req.files = {};
      slugify.mockReturnValue("test-product");
      const save = jest.fn().mockResolvedValue(true);
      productModel.mockImplementation(() => ({
        photo: { data: null, contentType: null },
        save,
      }));

      // Act
      await createProductController(req, res);

      // Assert
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test("should handle errors during creation", async () => {
      // Arrange
      const error = new Error("fail");
      req.fields = { ...baseFields };
      req.files = {};
      slugify.mockReturnValue("test-product");
      productModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in crearing product",
        })
      );
    });
  });

  describe("deleteProductController", () => {
    test("should delete product and return success", async () => {
      // Arrange
      req.params = { pid: "123" };
      const select = jest.fn();
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({ select });

      // Act
      await deleteProductController(req, res);

      // Assert
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("123");
      expect(select).toHaveBeenCalledWith("-photo");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Deleted successfully",
        })
      );
    });

    test("should handle errors during deletion", async () => {
      // Arrange
      const error = new Error("fail");
      req.params = { pid: "123" };
      const select = jest.fn().mockRejectedValue(error);
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({ select });

      // Act
      await deleteProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while deleting product",
        })
      );
    });
  });

  describe("updateProductController", () => {
    test("should return error if name is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, name: "" };

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test("should return error if description is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, description: "" };

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
    });

    test("should return error if price is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, price: null };

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    });

    test("should return error if category is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, category: "" };

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    });

    test("should return error if quantity is missing", async () => {
      // Arrange
      req.fields = { ...baseFields, quantity: 0 };

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
    });

    test("should return error if photo exceeds size limit", async () => {
      // Arrange
      req.fields = { ...baseFields };
      req.files = { photo: { size: 1000001 } };

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "photo is Required and should be less then 1mb",
      });
    });

    test("should update product with photo and return success", async () => {
      // Arrange
      const mockPhotoBuffer = Buffer.from("photo");
      req.fields = { ...baseFields };
      req.files = { photo: { size: 10, path: "/tmp/p.jpg", type: "image/jpeg" } };
      req.params = { pid: "123" };
      slugify.mockReturnValue("test-product");
      fs.readFileSync.mockReturnValue(mockPhotoBuffer);
      const save = jest.fn().mockResolvedValue(true);
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        photo: { data: null, contentType: null },
        save,
      });

      // Act
      await updateProductController(req, res);

      // Assert
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({ slug: "test-product" }),
        { new: true }
      );
      expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p.jpg");
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Updated Successfully",
        })
      );
    });

    test("should update product without photo and return success", async () => {
      // Arrange
      req.fields = { ...baseFields };
      req.files = {};
      req.params = { pid: "123" };
      slugify.mockReturnValue("test-product");
      const save = jest.fn().mockResolvedValue(true);
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        photo: { data: null, contentType: null },
        save,
      });

      // Act
      await updateProductController(req, res);

      // Assert
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test("should handle errors during update", async () => {
      // Arrange
      const error = new Error("fail");
      req.fields = { ...baseFields };
      req.files = {};
      req.params = { pid: "123" };
      slugify.mockReturnValue("test-product");
      productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

      // Act
      await updateProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in Updte product",
        })
      );
    });
  });
});
