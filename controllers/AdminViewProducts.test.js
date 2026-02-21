import { createProductController, deleteProductController, updateProductController } from "./productController";
import productModel from "../models/productModel.js";
import fs from "fs";
import slugify from "slugify";

jest.mock("../models/productModel.js");
jest.mock("fs");
jest.mock("slugify");

describe("Admin Product Controllers", () => {
  let req, res;

  beforeEach(() => {
    req = { fields: {}, files: {}, params: {} };
    res = {
      status: jest.fn(() => res),
      send: jest.fn(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createProductController", () => {
    test("should return error if required fields are missing", async () => {
      req.fields = {};
      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test("should create product and return success", async () => {
      req.fields = {
        name: "Test Product",
        description: "Desc",
        price: 10,
        category: "cat",
        quantity: 1,
        shipping: true,
      };
      req.files = {};
      slugify.mockReturnValue("test-product");
      productModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
      }));
      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );
    });

    test("should handle error in creation", async () => {
      req.fields = {
        name: "Test Product",
        description: "Desc",
        price: 10,
        category: "cat",
        quantity: 1,
        shipping: true,
      };
      req.files = {};
      slugify.mockReturnValue("test-product");
      productModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("fail")),
      }));
      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe("deleteProductController", () => {
    test("should delete product and return success", async () => {
      req.params = { pid: "123" };
      productModel.findByIdAndDelete = jest.fn().mockReturnValue({ select: jest.fn() });
      await deleteProductController(req, res);
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test("should handle error in deletion", async () => {
      req.params = { pid: "123" };
      productModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("fail"));
      await deleteProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe("updateProductController", () => {
    test("should return error if required fields are missing", async () => {
      req.fields = {};
      await updateProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    test("should update product and return success", async () => {
      req.fields = {
        name: "Test Product",
        description: "Desc",
        price: 10,
        category: "cat",
        quantity: 1,
        shipping: true,
      };
      req.files = {};
      req.params = { pid: "123" };
      slugify.mockReturnValue("test-product");
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        save: jest.fn().mockResolvedValue(true),
      });
      await updateProductController(req, res);
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({ slug: "test-product" }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test("should handle error in update", async () => {
      req.fields = {
        name: "Test Product",
        description: "Desc",
        price: 10,
        category: "cat",
        quantity: 1,
        shipping: true,
      };
      req.files = {};
      req.params = { pid: "123" };
      slugify.mockReturnValue("test-product");
      productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("fail"));
      await updateProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
});
