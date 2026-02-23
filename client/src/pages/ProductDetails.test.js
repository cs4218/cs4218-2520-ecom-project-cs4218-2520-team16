/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import ProductDetails from "./ProductDetails";
import { useNavigate, useParams } from "react-router-dom";

jest.mock("axios");

jest.mock(
  "./../components/Layout",
  () => ({ children }) => <div data-testid="layout">{children}</div>,
  { virtual: true }
);

jest.mock("../styles/ProductDetailsStyles.css", () => ({}), { virtual: true });

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: jest.fn(),
  };
});

const log = jest.spyOn(console, "log").mockImplementation(() => {});
afterAll(() => log.mockRestore());

describe("ProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches product details, then fetches related products and renders both", async () => {
    // arrange
    const user = userEvent;
    const navigateSpy = jest.fn();
    useNavigate.mockReturnValue(navigateSpy);
    useParams.mockReturnValue({ slug: "iphone-14" });

    const product = {
      _id: "p1",
      name: "iPhone 14",
      description: "A phone.",
      price: 1234,
      category: { _id: "c1", name: "Electronics" },
    };

    const related = [
      {
        _id: "p2",
        slug: "pixel-8",
        name: "Pixel 8",
        description:
          "This is a long description for Pixel 8 that should be truncated in the card.",
        price: 999,
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: { product } })
      .mockResolvedValueOnce({ data: { products: related } });

    // act
    await act(async () => render(<ProductDetails />));

    // assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/iphone-14"
      )
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/p1/c1"
      )
    );

    expect(screen.getByText(/Product Details/i)).toBeInTheDocument();
    expect(await screen.findByText(/Name\s*:\s*iPhone 14/i)).toBeInTheDocument();
    expect(screen.getByText(/Description\s*:\s*A phone\./i)).toBeInTheDocument();
    expect(screen.getByText(/Category\s*:\s*Electronics/i)).toBeInTheDocument();
    expect(screen.getByText("Pixel 8")).toBeInTheDocument();
    const moreDetailsButton = screen.getByRole("button", {
      name: /more details/i,
    });
    await user.click(moreDetailsButton);

    expect(navigateSpy).toHaveBeenCalledWith("/product/pixel-8");
  });

  test("shows 'No Similar Products found' when related products API returns empty list", async () => {
    // arrange
    useNavigate.mockReturnValue(jest.fn());
    useParams.mockReturnValue({ slug: "iphone-14" });

    const product = {
      _id: "p1",
      name: "iPhone 14",
      description: "A phone.",
      price: 1234,
      category: { _id: "c1", name: "Electronics" },
    };

    axios.get
      .mockResolvedValueOnce({ data: { product } })
      .mockResolvedValueOnce({ data: { products: [] } });

    // act
    await act(async () => render(<ProductDetails />));

    // assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/iphone-14"
      )
    );
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/p1/c1"
      )
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
  });

  test("does not fetch related products if API returns a product without category", async () => {
    // arrange
    useNavigate.mockReturnValue(jest.fn());
    useParams.mockReturnValue({ slug: "mystery-product" });

    const productWithoutCategory = {
      _id: "p99",
      name: "Mystery",
      description: "No category in payload.",
      price: 50,
      // category missing
    };

    axios.get.mockResolvedValueOnce({ data: { product: productWithoutCategory } });

    // act
    await act(async () => render(<ProductDetails />));

    // assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/mystery-product"
      )
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
  });

  test("handles error when getProduct fails", async () => {
    // arrange
    const errorMessage = "Network Error";
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    useParams.mockReturnValue({ slug: "iphone-14" });

    // act
    await act(async () => render(<ProductDetails />));

    // assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/iphone-14"
      )
    );
    expect(console.log).toHaveBeenCalledWith(new Error(errorMessage));
  });

  test("handles error when getSimilarProduct fails", async () => {
    // arrange
    const product = {
      _id: "p1",
      name: "iPhone 14",
      description: "A phone.",
      price: 1234,
      category: { _id: "c1", name: "Electronics" },
    };

    axios.get
      .mockResolvedValueOnce({ data: { product } })
      .mockRejectedValueOnce(new Error("Related products fetch failed"));

    useParams.mockReturnValue({ slug: "iphone-14" });

    // act
    await act(async () => render(<ProductDetails />));

    // assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/iphone-14"
      )
    );
    expect(console.log).toHaveBeenCalledWith(new Error("Related products fetch failed"));
  });

  test("shows a loading state or placeholder while data is being fetched", async () => {
    // arrange
    useParams.mockReturnValue({ slug: "iphone-14" });
    axios.get.mockResolvedValueOnce({ data: { product: {} } });

    // act
    await act(async () => render(<ProductDetails />));

    // assert
    expect(screen.getByText(/Product Details/i)).toBeInTheDocument();
    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
  });
});