// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4
// Bug fixed by Wen Han Tang with help from ChatGPT A0340008W

import authRoutes from "../routes/authRoute.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import slugify from "slugify";

jest.mock("braintree", () => ({
  Environment: { Sandbox: "Sandbox" },
  BraintreeGateway: jest.fn(() => ({
    transaction: { sale: jest.fn() },
    clientToken: { generate: jest.fn() },
  })),
}));

jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../models/productModel.js");
jest.mock("slugify");
jest.mock("../middlewares/authMiddleware.js", () => ({
  requireSignIn: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
}));

function dispatchRequest({ router = categoryRoutes, method, url, body, headers = {} }) {
  return new Promise((resolve, reject) => {
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
      status(code) {
        this.statusCode = code;
        return this;
      },
      set(name, value) {
        this.headers[name] = value;
        return this;
      },
      send(payload) {
        this.body = payload;
        resolve({ req, res: this });
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve({ req, res: this });
        return this;
      },
    };

    router.handle(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ req, res });
    });
  });
}

describe("Category route integrations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("get-category returns the controller payload through the router", async () => {
    // Arrange
    categoryModel.find.mockResolvedValue([
      { _id: "c-1", name: "Electronics", slug: "electronics" },
      { _id: "c-2", name: "Books", slug: "books" },
    ]);

    // Act
    const { res } = await dispatchRequest({
      method: "GET",
      url: "/get-category",
    });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category).toHaveLength(2);
    expect(res.body.category[0].slug).toBe("electronics");
  });

  test("single-category routes the slug param into the controller", async () => {
    // Arrange
    categoryModel.findOne.mockResolvedValue({
      _id: "c-1",
      name: "Electronics",
      slug: "electronics",
    });

    // Act
    const { res } = await dispatchRequest({
      method: "GET",
      url: "/single-category/electronics",
    });

    // Assert
    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: "electronics",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.category.name).toBe("Electronics");
  });

  test("create-category goes through the protected route stack and returns success", async () => {
    // Arrange
    categoryModel.findOne.mockResolvedValue(null);
    slugify.mockReturnValue("gadgets");

    const save = jest.fn().mockResolvedValue({
      _id: "c-3",
      name: "Gadgets",
      slug: "gadgets",
    });
    categoryModel.mockImplementation(() => ({ save }));

    // Act
    const { res } = await dispatchRequest({
      method: "POST",
      url: "/create-category",
      body: { name: "Gadgets" },
    });

    // Assert
    expect(slugify).toHaveBeenCalledWith("Gadgets");
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.category.slug).toBe("gadgets");
  });

  test("create-category returns validation error when name is missing", async () => {
    // Arrange
    const body = {};

    // Act
    const { res } = await dispatchRequest({
      method: "POST",
      url: "/create-category",
      body,
    });

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Name is required");
    expect(categoryModel.findOne).not.toHaveBeenCalled();
  });

  test("create-category returns the duplicate response without saving a new category", async () => {
    // Arrange
    categoryModel.findOne.mockResolvedValue({
      _id: "c-3",
      name: "Gadgets",
      slug: "gadgets",
    });

    // Act
    const { res } = await dispatchRequest({
      method: "POST",
      url: "/create-category",
      body: { name: "Gadgets" },
    });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Category Already Exisits");
    expect(slugify).not.toHaveBeenCalled();
    expect(categoryModel).not.toHaveBeenCalled();
  });

  test("update-category routes the category id and slugifies the new name", async () => {
    // Arrange
    slugify.mockReturnValue("smart-home");
    categoryModel.findByIdAndUpdate.mockResolvedValue({
      _id: "c-1",
      name: "Smart Home",
      slug: "smart-home",
    });

    // Act
    const { res } = await dispatchRequest({
      method: "PUT",
      url: "/update-category/c-1",
      body: { name: "Smart Home" },
    });

    // Assert
    expect(slugify).toHaveBeenCalledWith("Smart Home");
    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "c-1",
      { name: "Smart Home", slug: "smart-home" },
      { new: true }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.slug).toBe("smart-home");
  });

  test("delete-category routes the category id into the delete controller", async () => {
    // Arrange
    categoryModel.findByIdAndDelete.mockResolvedValue({ _id: "c-1" });

    // Act
    const { res } = await dispatchRequest({
      method: "DELETE",
      url: "/delete-category/c-1",
    });

    // Assert
    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("c-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Categry Deleted Successfully");
  });

  test("update-category returns the controller error payload when persistence fails", async () => {
    // Arrange
    slugify.mockReturnValue("smart-home");
    categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("db down"));

    // Act
    const { res } = await dispatchRequest({
      method: "PUT",
      url: "/update-category/c-1",
      body: { name: "Smart Home" },
    });

    // Assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Error while updating category");
  });

  test("delete-category returns the controller error payload when deletion fails", async () => {
    // Arrange
    categoryModel.findByIdAndDelete.mockRejectedValue(new Error("db down"));

    // Act
    const { res } = await dispatchRequest({
      method: "DELETE",
      url: "/delete-category/c-1",
    });

    // Assert
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("error while deleting category");
  });
});

describe("Product route integrations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("get-product returns the controller payload through the router", async () => {
    // Arrange
    const products = [
      { _id: "p-1", name: "Laptop", slug: "laptop" },
      { _id: "p-2", name: "Tablet", slug: "tablet" },
    ];
    const lean = jest.fn().mockResolvedValue(products);
    const sort = jest.fn().mockReturnValue({ lean });
    const limit = jest.fn().mockReturnValue({ sort });
    const select = jest.fn().mockReturnValue({ limit });
    const populate = jest.fn().mockReturnValue({ select });
    productModel.find.mockReturnValue({ populate });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/get-product",
    });

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(populate).toHaveBeenCalledWith("category");
    expect(select).toHaveBeenCalledWith("-photo");
    expect(limit).toHaveBeenCalledWith(12);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.counTotal).toBe(2);
  });

  test("single-product routes the slug param into the controller", async () => {
    // Arrange
    const lean = jest.fn().mockResolvedValue({
      _id: "p-1",
      name: "Laptop",
      slug: "laptop",
      category: { _id: "c-1", name: "Electronics" },
    });
    const populate = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ populate });
    productModel.findOne.mockReturnValue({ select });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/get-product/laptop",
    });

    // Assert
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "laptop" });
    expect(select).toHaveBeenCalledWith("-photo");
    expect(populate).toHaveBeenCalledWith("category");
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.product.name).toBe("Laptop");
  });

  test("product-photo routes the product id and returns the binary payload", async () => {
    // Arrange
    const imageBuffer = Buffer.from("photo-bytes");
    const select = jest.fn().mockResolvedValue({
      photo: {
        data: imageBuffer,
        contentType: "image/png",
      },
    });
    productModel.findById.mockReturnValue({ select });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/product-photo/p-1",
    });

    // Assert
    expect(productModel.findById).toHaveBeenCalledWith("p-1");
    expect(select).toHaveBeenCalledWith("photo");
    expect(res.headers["Content-type"]).toBe("image/png");
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.toString()).toBe("photo-bytes");
  });

  test("delete-product routes the product id into the delete controller", async () => {
    // Arrange
    const select = jest.fn().mockResolvedValue({ _id: "p-1" });
    productModel.findByIdAndDelete.mockReturnValue({ select });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "DELETE",
      url: "/delete-product/p-1",
    });

    // Assert
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("p-1");
    expect(select).toHaveBeenCalledWith("-photo");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Product Deleted successfully");
  });

  test("product-filters forwards checked and radio arrays to the controller query", async () => {
    // Arrange
    productModel.find.mockResolvedValue([{ _id: "p-1", name: "Laptop" }]);

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "POST",
      url: "/product-filters",
      body: { checked: ["c-1"], radio: [100, 500] },
    });

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({
      category: ["c-1"],
      price: { $gte: 100, $lte: 500 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(1);
  });

  test("product-filters keeps the query empty when no filters are selected", async () => {
    // Arrange
    productModel.find.mockResolvedValue([]);

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "POST",
      url: "/product-filters",
      body: { checked: [], radio: [] },
    });

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toEqual([]);
  });

  test("product-count returns the estimated document count through the router", async () => {
    // Arrange
    productModel.estimatedDocumentCount = jest.fn().mockResolvedValue(12);

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/product-count",
    });

    // Assert
    expect(productModel.estimatedDocumentCount).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(12);
  });

  test("product-list routes the page param into the pagination controller", async () => {
    // Arrange
    const lean = jest.fn().mockResolvedValue([{ _id: "p-1", name: "Laptop" }]);
    const sort = jest.fn().mockReturnValue({ lean });
    const limit = jest.fn().mockReturnValue({ sort });
    const skip = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ skip });
    productModel.find.mockReturnValue({ select });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/product-list/3",
    });

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(select).toHaveBeenCalledWith("-photo");
    expect(skip).toHaveBeenCalledWith(12);
    expect(limit).toHaveBeenCalledWith(6);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  test("search routes the keyword param into the regex query", async () => {
    // Arrange
    const lean = jest.fn().mockResolvedValue([{ _id: "p-1", name: "Tablet" }]);
    const limit = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ limit });
    productModel.find.mockReturnValue({ select });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/search/tablet",
    });

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "tablet", $options: "i" } },
        { description: { $regex: "tablet", $options: "i" } },
      ],
    });
    expect(select).toHaveBeenCalledWith("-photo");
    expect(limit).toHaveBeenCalledWith(20);
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual([{ _id: "p-1", name: "Tablet" }]);
  });

  test("related-product routes both product and category params into the controller", async () => {
    // Arrange
    const lean = jest.fn().mockResolvedValue([{ _id: "p-2", name: "Mouse" }]);
    const populate = jest.fn().mockReturnValue({ lean });
    const limit = jest.fn().mockReturnValue({ populate });
    const select = jest.fn().mockReturnValue({ limit });
    productModel.find.mockReturnValue({ select });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/related-product/p-1/c-1",
    });

    // Assert
    expect(productModel.find).toHaveBeenCalledWith({
      category: "c-1",
      _id: { $ne: "p-1" },
    });
    expect(select).toHaveBeenCalledWith("-photo");
    expect(limit).toHaveBeenCalledWith(3);
    expect(populate).toHaveBeenCalledWith("category");
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(1);
  });

  test("product-category looks up the slug and returns products for that category", async () => {
    // Arrange
    const category = { _id: "c-1", name: "Electronics", slug: "electronics" };
    const categoryLean = jest.fn().mockResolvedValue(category);
    categoryModel.findOne.mockReturnValue({ lean: categoryLean });
    const lean = jest.fn().mockResolvedValue([{ _id: "p-1", name: "Laptop" }]);
    const populate = jest.fn().mockReturnValue({ lean });
    productModel.find.mockReturnValue({ populate });

    // Act
    const { res } = await dispatchRequest({
      router: productRoutes,
      method: "GET",
      url: "/product-category/electronics",
    });

    // Assert
    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
    expect(categoryLean).toHaveBeenCalledTimes(1);
    expect(productModel.find).toHaveBeenCalledWith({ category: "c-1" });
    expect(populate).toHaveBeenCalledWith("category");
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.category.name).toBe("Electronics");
    expect(res.body.products).toHaveLength(1);
  });
});

describe("Auth route integrations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("order-status routes the order id and status payload into the controller", async () => {
    // Arrange
    orderModel.findByIdAndUpdate.mockResolvedValue({
      _id: "o-1",
      status: "Processing",
    });

    // Act
    const { res } = await dispatchRequest({
      router: authRoutes,
      method: "PUT",
      url: "/order-status/o-1",
      body: { status: "Processing" },
    });

    // Assert
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "o-1",
      { status: "Processing" },
      { new: true }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe("o-1");
    expect(res.body.status).toBe("Processing");
  });
});
