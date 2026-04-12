// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import authRoutes from "../../routes/authRoute.js";
import categoryRoutes from "../../routes/categoryRoutes.js";
import productRoutes from "../../routes/productRoutes.js";
import orderModel from "../../models/orderModel.js";
import {
  clearResponseCache,
  responseCache,
} from "../../middlewares/responseCacheMiddleware.js";

jest.mock("braintree", () => ({
  Environment: { Sandbox: "Sandbox" },
  BraintreeGateway: jest.fn(() => ({
    transaction: { sale: jest.fn() },
    clientToken: { generate: jest.fn() },
  })),
}));

const getRouteMiddlewareNames = (router, method, path) => {
  const routeLayer = router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method.toLowerCase()]
  );

  return routeLayer ? routeLayer.route.stack.map((layer) => layer.name) : [];
};

const makeResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.send = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

describe("Security auditing and availability checks", () => {
  afterEach(() => {
    clearResponseCache();
  });

  test("admin-only auth routes keep both authentication and authorization middleware", () => {
    // arrange
    const middlewareNames = getRouteMiddlewareNames(
      authRoutes,
      "GET",
      "/admin-auth"
    );

    // act
    const hasRequireSignIn = middlewareNames.includes("requireSignIn");
    const hasIsAdmin = middlewareNames.includes("isAdmin");

    // assert
    expect(hasRequireSignIn).toBe(true);
    expect(hasIsAdmin).toBe(true);
  });

  test("category mutation routes are protected by both requireSignIn and isAdmin", () => {
    // arrange
    const protectedCategoryRoutes = [
      { method: "POST", path: "/create-category" },
      { method: "PUT", path: "/update-category/:id" },
      { method: "DELETE", path: "/delete-category/:id" },
    ];

    // act
    const categoryRouteMiddleware = protectedCategoryRoutes.map(
      ({ method, path }) => ({
        path,
        middlewareNames: getRouteMiddlewareNames(categoryRoutes, method, path),
      })
    );

    // assert
    for (const { middlewareNames } of categoryRouteMiddleware) {
      expect(middlewareNames).toContain("requireSignIn");
      expect(middlewareNames).toContain("isAdmin");
    }
  });

  test("product mutation routes are protected by both requireSignIn and isAdmin", () => {
    // arrange
    const protectedProductRoutes = [
      { method: "POST", path: "/create-product" },
      { method: "PUT", path: "/update-product/:pid" },
      { method: "DELETE", path: "/delete-product/:pid" },
    ];

    // act
    const productRouteMiddleware = protectedProductRoutes.map(
      ({ method, path }) => ({
        path,
        middlewareNames: getRouteMiddlewareNames(productRoutes, method, path),
      })
    );

    // assert
    for (const { middlewareNames } of productRouteMiddleware) {
      expect(middlewareNames).toContain("requireSignIn");
      expect(middlewareNames).toContain("isAdmin");
    }
  });

  test("orders retain timestamps to support an audit trail", () => {
    // arrange
    const timestamps = orderModel.schema.options.timestamps;

    // act
    const hasCreatedAndUpdatedTimestamps = timestamps === true;

    // assert
    expect(hasCreatedAndUpdatedTimestamps).toBe(true);
  });

  test("responseCache caches successful GET responses to reduce repeated load", () => {
    // arrange
    const middleware = responseCache(30);
    const next = jest.fn();
    const firstReq = {
      method: "GET",
      originalUrl: "/api/v1/product/get-product",
    };
    const firstRes = makeResponse();
    const secondReq = {
      method: "GET",
      originalUrl: "/api/v1/product/get-product",
    };
    const secondRes = makeResponse();
    secondRes.json = jest.fn((payload) => {
      secondRes.body = payload;
      return secondRes;
    });

    // act
    middleware(firstReq, firstRes, next);
    firstRes.status(200).json({ success: true, products: [{ _id: "product_id" }] });
    middleware(secondReq, secondRes, next);

    // assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(secondRes.status).toHaveBeenCalledWith(200);
    expect(secondRes.json).toHaveBeenCalledWith({
      success: true,
      products: [{ _id: "product_id" }],
    });
  });

  test("responseCache does not cache non-GET requests so write paths stay live", () => {
    // arrange
    const middleware = responseCache(30);
    const next = jest.fn();
    const req = {
      method: "POST",
      originalUrl: "/api/v1/product/create-product",
    };
    const res = makeResponse();

    // act
    middleware(req, res, next);

    // assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});
