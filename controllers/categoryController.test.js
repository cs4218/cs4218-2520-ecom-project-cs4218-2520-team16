// Created By Wen Han Tang A0340008W
import {
  createCategoryController,
  categoryControlller,
} from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";

import { describe, it, expect, beforeEach } from "@jest/globals";

jest.mock("slugify", () => jest.fn(() => "new-category"));

jest.mock("../models/categoryModel.js", () => {
  const categoryModelMock = jest.fn(function Category(payload) {
    this.payload = payload;
    this.save = jest.fn().mockResolvedValue({
      _id: "cat-1",
      ...payload,
    });
  });

  categoryModelMock.findOne = jest.fn();
  categoryModelMock.find = jest.fn();

  return {
    __esModule: true,
    default: categoryModelMock,
  };
});

const makeResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("categoryController regression tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createCategoryController: returns 500 payload with error on DB failure", async () => {
    categoryModel.findOne.mockRejectedValue(new Error("db-down"));
    const req = { body: { name: "Shoes" } };
    const res = makeResponse();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Errro in Category",
        error: expect.any(Error),
      })
    );
  });

  it("createCategoryController: rejects empty name with 401", async () => {
    const req = { body: {} };
    const res = makeResponse();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
  });

  it("categoryControlller: returns categories list", async () => {
    const categories = [{ _id: "c1", name: "Cat1" }];
    categoryModel.find.mockResolvedValue(categories);

    const res = makeResponse();

    await categoryControlller({}, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: categories,
    });
  });
});
