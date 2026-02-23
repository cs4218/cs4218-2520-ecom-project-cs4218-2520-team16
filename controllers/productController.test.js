/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController
} from "../controllers/productController.js";
import orderModel from "../models/orderModel.js";

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import braintree from "braintree";

jest.mock("dotenv");
jest.mock("fs");
jest.mock("slugify");
jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js")
//jest.mock("braintree");

jest.mock("braintree", () => {
  const generate = jest.fn();
  const sale = jest.fn();

  const gateway = {
    clientToken: { generate },
    transaction: { sale },
  };

  const mod = {
    Environment: { Sandbox: "Sandbox" },
    BraintreeGateway: jest.fn(() => gateway), // controller calls `new`
    __mocks: { gateway, generate, sale },
  };

  return mod;
});

beforeAll(async () => {
  // Arrange
  process.env.BRAINTREE_MERCHANT_ID = "mid";
  process.env.BRAINTREE_PUBLIC_KEY = "pub";
  process.env.BRAINTREE_PRIVATE_KEY = "priv";
});


const makeResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  // Arrange/Act
  jest.clearAllMocks();
  // Assert (none)
});

const log = jest.spyOn(console, "log").mockImplementation(() => {});
afterAll(() => log.mockRestore());

describe("getProductController", () => {
  it("success: returns products list", async () => {
    // Arrange
    const productList = [{ _id: "p1" }, { _id: "p2" }];

    const mockFindResult = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(productList),
    };
    productModel.find.mockReturnValue(mockFindResult);

    const res = makeResponse();

    // Act
    await getProductController({}, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockFindResult.populate).toHaveBeenCalledWith("category");
    expect(mockFindResult.select).toHaveBeenCalledWith("-photo");
    expect(mockFindResult.limit).toHaveBeenCalledWith(12);
    expect(mockFindResult.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: 2,
      message: "ALlProducts ",
      products: productList,
    });
  });

  it("error: query error 500", async () => {
    // Arrange
    const mockFindResult = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("test")),
    };
    productModel.find.mockReturnValue(mockFindResult);

    const res = makeResponse();

    // Act
    await getProductController({}, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr in getting products",
      error: "test",
    });
  });
});

describe("getSingleProductController", () => {
  it("success: returns single product (200) and chains query", async () => {
    // Arrange
    const product = { _id: "p1", slug: "abc" };

    const mockFindResult = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(product),
    };
    productModel.findOne.mockReturnValue(mockFindResult);

    const req = { params: { slug: "product-slug" } };
    const res = makeResponse();

    // Act
    await getSingleProductController(req, res);

    // Assert
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "product-slug" });
    expect(mockFindResult.select).toHaveBeenCalledWith("-photo");
    expect(mockFindResult.populate).toHaveBeenCalledWith("category");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: product,
    });
  });

  it("error: query error 500", async () => {
    // Arrange
    const mockFindResult = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(new Error("test")),
    };
    productModel.findOne.mockReturnValue(mockFindResult);

    const req = { params: { slug: "product-slug" } };
    const res = makeResponse();

    // Act
    await getSingleProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Eror while getitng single product",
      })
    );
  });
});

describe("productPhotoController", () => {
  it("success: photo exists", async () => {
    // Arrange
    const product = {
      photo: { data: Buffer.from("img"), contentType: "image/png" },
    };
    const mockResult = { select: jest.fn().mockResolvedValue(product) };
    productModel.findById.mockReturnValue(mockResult);

    const req = { params: { pid: "pid1" } };
    const res = makeResponse();

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(productModel.findById).toHaveBeenCalledWith("pid1");
    expect(mockResult.select).toHaveBeenCalledWith("photo");
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(Buffer.from("img"));
  });

  it("success: photo not exists", async () => {
    // Arrange
    const product = { photo: { data: null, contentType: "image/png" } };
    const mockResult = { select: jest.fn().mockResolvedValue(product) };
    productModel.findById.mockReturnValue(mockResult);

    const req = { params: { pid: "pid1" } };
    const res = makeResponse();

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("error: 500", async () => {
    // Arrange
    productModel.findById.mockImplementation(() => {
      throw new Error("test");
    });

    const req = { params: { pid: "pid1" } };
    const res = makeResponse();

    // Act
    await productPhotoController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Erorr while getting photo",
      })
    );
  });
});

describe("productFiltersController", () => {
  it("success: checked + radio -> builds category + price args", async () => {
    // Arrange
    const docs = [{ _id: "p1" }];
    productModel.find.mockResolvedValue(docs);

    const req = { body: { checked: ["c1", "c2"], radio: [10, 50] } };
    const res = makeResponse();

    // Act
    await productFiltersController(req, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({
      category: ["c1", "c2"],
      price: { $gte: 10, $lte: 50 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: docs });
  });

  it("success: empty checked + empty radio -> args stays {}", async () => {
    // Arrange
    productModel.find.mockResolvedValue([]);

    const req = { body: { checked: [], radio: [] } };
    const res = makeResponse();

    // Act
    await productFiltersController(req, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("error: 400", async () => {
    // Arrange
    productModel.find.mockRejectedValue(new Error("test"));

    const req = { body: { checked: ["c1"], radio: [1, 2] } };
    const res = makeResponse();

    // Act
    await productFiltersController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error WHile Filtering Products",
      })
    );
  });
});

describe("productCountController", () => {
  it("success: estimatedDocumentCount (200)", async () => {
    // Arrange
    const mockResult = { estimatedDocumentCount: jest.fn().mockResolvedValue(42) };
    productModel.find.mockReturnValue(mockResult);

    const res = makeResponse();

    // Act
    await productCountController({}, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(mockResult.estimatedDocumentCount).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, total: 42 });
  });

  it("error: estimatedDocumentCount rejects -> 400", async () => {
    // Arrange
    const mockResult = { estimatedDocumentCount: jest.fn().mockRejectedValue(new Error("bad")) };
    productModel.find.mockReturnValue(mockResult);

    const res = makeResponse();

    // Act
    await productCountController({}, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in product count",
      })
    );
  });
});

describe("productListController", () => {
  it("success: no page param -> defaults to 1, skip 0 (200)", async () => {
    // Arrange
    const docs = [{ _id: "p1" }];
    const mockResult = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(docs),
    };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: {} };
    const res = makeResponse();

    // Act
    await productListController(req, res);

    // Assert
    expect(mockResult.select).toHaveBeenCalledWith("-photo");
    expect(mockResult.skip).toHaveBeenCalledWith(0);
    expect(mockResult.limit).toHaveBeenCalledWith(6);
    expect(mockResult.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: docs });
  });

  it("success: page=3 -> skip 12", async () => {
    // Arrange
    const mockResult = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: { page: "3" } };
    const res = makeResponse();

    // Act
    await productListController(req, res);

    // Assert
    expect(mockResult.skip).toHaveBeenCalledWith(12);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("error: 400", async () => {
    // Arrange
    const mockResult = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("test")),
    };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: { page: "1" } };
    const res = makeResponse();

    // Act
    await productListController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "error in per page ctrl",
      })
    );
  });
});

describe("searchProductController", () => {
  it("success: builds regex query and returns res.json(results)", async () => {
    // Arrange
    const docs = [{ _id: "p1" }];
    const mockResult = { select: jest.fn().mockResolvedValue(docs) };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: { keyword: "phone" } };
    const res = makeResponse();

    // Act
    await searchProductController(req, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "phone", $options: "i" } },
        { description: { $regex: "phone", $options: "i" } },
      ],
    });
    expect(mockResult.select).toHaveBeenCalledWith("-photo");
    expect(res.json).toHaveBeenCalledWith(docs);
  });

  it("error: 400", async () => {
    // Arrange
    productModel.find.mockImplementation(() => {
      throw new Error("test");
    });

    const req = { params: { keyword: "x" } };
    const res = makeResponse();

    // Act
    await searchProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error In Search Product API",
      })
    );
  });
});

describe("realtedProductController", () => {
  it("success: returns related products (limit 3) and populates category", async () => {
    // Arrange
    const docs = [{ _id: "p2" }];
    const mockResult = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(docs),
    };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: { pid: "p1", cid: "c1" } };
    const res = makeResponse();

    // Act
    await realtedProductController(req, res);

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({
      category: "c1",
      _id: { $ne: "p1" },
    });
    expect(mockResult.select).toHaveBeenCalledWith("-photo");
    expect(mockResult.limit).toHaveBeenCalledWith(3);
    expect(mockResult.populate).toHaveBeenCalledWith("category");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: docs });
  });

  it("error: 400", async () => {
    // Arrange
    const mockResult = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(new Error("test")),
    };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: { pid: "p1", cid: "c1" } };
    const res = makeResponse();

    // Act
    await realtedProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "error while geting related product",
      })
    );
  });
});

describe("productCategoryController", () => {
  it("success: finds category by slug and returns products", async () => {
    // Arrange
    const category = { _id: "c1", slug: "cat-slug" };
    const docs = [{ _id: "p1" }];

    categoryModel.findOne.mockResolvedValue(category);

    const mockResult = { populate: jest.fn().mockResolvedValue(docs) };
    productModel.find.mockReturnValue(mockResult);

    const req = { params: { slug: "cat-slug" } };
    const res = makeResponse();

    // Act
    await productCategoryController(req, res);

    // Assert
    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "cat-slug" });
    expect(productModel.find).toHaveBeenCalledWith({ category });
    expect(mockResult.populate).toHaveBeenCalledWith("category");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category,
      products: docs,
    });
  });

  it("error: 400", async () => {
    // Arrange
    categoryModel.findOne.mockRejectedValue(new Error("test"));

    const req = { params: { slug: "cat-slug" } };
    const res = makeResponse();

    // Act
    await productCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While Getting products",
      })
    );
  });
});


describe("braintreeTokenController", () => {
  it("success: generate returns response -> res.send(response)", async () => {
    // Arrange
    const tokenResponse = { clientToken: "fake_token" };
    braintree.__mocks.gateway.clientToken.generate.mockImplementation((opts, cb) =>
      cb(null, tokenResponse)
    );
    const req = {};
    const res = makeResponse();

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(braintree.__mocks.gateway.clientToken.generate).toHaveBeenCalledWith(
      {},
      expect.any(Function)
    );
    expect(res.send).toHaveBeenCalledWith(tokenResponse);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it("error: generate returns err -> res.status(500).send(err)", async () => {
    // Arrange
    const err = new Error("token failed");
    braintree.__mocks.gateway.clientToken.generate.mockImplementation((opts, cb) =>
      cb(err, null)
    );
    const req = {};
    const res = makeResponse();

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(err);
  });

  it("catch: logs error", async () => {
    // Arrange
    braintree.__mocks.gateway.clientToken.generate.mockImplementation(() => {
      throw new Error("test");
    });
    const req = {};
    const res = makeResponse();

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(console.log).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("brainTreePaymentController", () => {
  it("success: sale returns result -> creates order + res.json({ok:true})", async () => {
    // Arrange
    const result = { id: "txn_1", status: "submitted_for_settlement" };
    braintree.__mocks.gateway.transaction.sale.mockImplementation((payload, cb) =>
      cb(null, result)
    );

    const cart = [{ _id: "p1", price: 100 }, { _id: "p2", price: 250 }];
    const req = { body: { nonce: "nonce_123", cart }, user: { _id: "user1" } };
    const res = makeResponse();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(braintree.__mocks.gateway.transaction.sale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 350,
        paymentMethodNonce: "nonce_123",
        options: { submitForSettlement: true },
      }),
      expect.any(Function)
    );

    expect(orderModel).toHaveBeenCalledWith(
      expect.objectContaining({
        products: cart,
        payment: result,
        buyer: "user1",
      })
    );
    expect(orderModel.mock.instances[0].save).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it("error: sale returns falsy result -> res.status(500).send(error)", async () => {
    // Arrange
    const err = new Error("sale failed");
    braintree.__mocks.gateway.transaction.sale.mockImplementation((payload, cb) =>
      cb(err, null)
    );

    const req = { body: { nonce: "n", cart: [{ price: 10 }] }, user: { _id: "user1" } };
    const res = makeResponse();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("catch: logs error", async () => {
    // Arrange
    braintree.__mocks.gateway.transaction.sale.mockImplementation(() => {
      throw new Error("test");
    });

    const req = { body: { nonce: "n", cart: [{ price: 10 }] }, user: { _id: "user1" } };
    const res = makeResponse();

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(console.log).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});