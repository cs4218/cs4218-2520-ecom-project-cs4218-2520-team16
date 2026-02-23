/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import { useNavigate, useParams } from "react-router-dom";

jest.mock("axios");

jest.mock(
  "../components/Layout",
  () => ({ children }) => <div data-testid="layout">{children}</div>,
  { virtual: true }
);

jest.mock("react-router-dom");

describe("CategoryProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches products by category slug and renders the list", async () => {
    // arrange
    const navigateSpy = jest.fn();
    useNavigate.mockReturnValue(navigateSpy);
    useParams.mockReturnValue({ slug: "electronics" });

    const products = [
      {
        _id: "p1",
        slug: "iphone-14",
        name: "iPhone 14",
        price: 1234,
        description:
          "This is a long description for iPhone 14 that should be truncated in the card.",
      },
      {
        _id: "p2",
        slug: "pixel-8",
        name: "Pixel 8",
        price: 999,
        description:
          "This is a long description for Pixel 8 that should also be truncated in the card.",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: {
        category: { name: "Electronics" },
        products,
      },
    });

    // act
    render(<CategoryProduct />);

    // assert
    // Wait for the UI to reflect the async axios response (not just that axios.get was called)
    expect(
      await screen.findByRole("heading", {
        level: 4,
        name: /Category\s*-\s*Electronics/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/2\s*result\s*found/i)).toBeInTheDocument();

    // Product 1
    expect(screen.getByText("iPhone 14")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "iPhone 14" })).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/p1"
    );

    // Product 2
    expect(screen.getByText("Pixel 8")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Pixel 8" })).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/p2"
    );

    // Request made with expected URL
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/electronics"
    );

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  test("clicking 'More Details' navigates to the product page", async () => {
    // arrange
    const user = userEvent;
    const navigateSpy = jest.fn();
    useNavigate.mockReturnValue(navigateSpy);
    useParams.mockReturnValue({ slug: "electronics" });

    axios.get.mockResolvedValueOnce({
      data: {
        category: { name: "Electronics" },
        products: [
          {
            _id: "p1",
            slug: "iphone-14",
            name: "iPhone 14",
            price: 1234,
            description:
              "This is a long description for iPhone 14 that should be truncated in the card.",
          },
        ],
      },
    });

    // act
    render(<CategoryProduct />);

    // Wait until product is rendered
    await screen.findByText("iPhone 14");

    const moreDetailsButton = screen.getByRole("button", {
      name: /more details/i,
    });
    await user.click(moreDetailsButton);

    // assert
    expect(navigateSpy).toHaveBeenCalledWith("/product/iphone-14");
  });

  test("does not fetch when params.slug is missing", async () => {
    // arrange
    useNavigate.mockReturnValue(jest.fn());
    useParams.mockReturnValue({});

    // act
    render(<CategoryProduct />);

    // assert
    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
  });
});