/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import { act } from "react-dom/test-utils";
import toast from "react-hot-toast";
import DropIn from 'braintree-web-drop-in-react'

jest.mock("../context/auth");
jest.mock("../context/cart");
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock(
  "./../components/Layout",
  () => ({ children }) => <div data-testid="layout">{children}</div>,
  { virtual: true }
);

describe("CartPage", () => {
  const mockSetAuth = jest.fn();
  const mockSetCart = jest.fn();

  beforeEach(() => {
    mockSetAuth.mockClear();
    mockSetCart.mockClear();
    useAuth.mockReturnValue([{ token: "mockToken", user: { name: "User", address: "NUS" } }, mockSetAuth]);
    useCart.mockReturnValue([[{ _id: "1", name: "Item 1", price: 100, description: "Item description" }], mockSetCart]);
    axios.get.mockResolvedValue({ data: { clientToken: "mockToken" } });
    axios.post.mockResolvedValue({ data: {} });
  });

  it("should display a guest greeting and cart message for unauthenticated users", async () => {
    // arrange
    useAuth.mockReturnValue([{}, mockSetAuth]);

    // act
    await act(async () => {
      render(
        <Router>
          <CartPage />
        </Router>
      );
    });

    // assert
    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
    expect(screen.getByText("You Have 1 items in your cart please login to checkout !")).toBeInTheDocument();
  });

  it("should render the cart page with the correct user greeting", async () => {
    // arrange in beforeEach
    // act
    await act(async () =>render(
      <Router>
        <CartPage />
      </Router>
    ));
    // assert
    expect(screen.getByText('Hello User')).toBeInTheDocument();
  });

  it("should correctly calculate the total price", async () => {
    // arrange in beforeEach
    // act
    await act(async () =>render(
      <Router>
        <CartPage />
      </Router>
    ));
    //assert
    expect(screen.getByText(/Total : \$100/)).toBeInTheDocument(); // Assuming $100 is the total
  });

  it("should remove an item from the cart", async () => {
    // arrange in beforeEach
    // act
    await act(async () =>render(
      <Router>
        <CartPage />
      </Router>
    ));

    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    // assert
    expect(mockSetCart).toHaveBeenCalledTimes(1);
  });

  it("should show cart is empty message when cart is empty", async () => {
    // arrange
    useCart.mockReturnValue([[], mockSetCart]);
    // act
    await act(async () => {
      render(
        <Router>
          <CartPage />
        </Router>
      );
    });
    // assert
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  it("should correctly handle payment", async () => {
    // arrange
    const mockInstance = {
      requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "mockNonce" })
    };

    jest.spyOn(require('braintree-web-drop-in-react'), 'default').mockImplementation(({ onInstance }) => {
      onInstance(mockInstance);
      return null;
    });

    // act
    await act(async () => {
      render(
        <Router>
          <CartPage />
        </Router>
      );
    });

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    const payButton = screen.getByText("Make Payment");
    await expect(payButton).not.toBeDisabled();
    await fireEvent.click(payButton);
    // assert
    await expect(axios.post).toHaveBeenCalledWith("/api/v1/product/braintree/payment", {
      nonce: "mockNonce",
      cart: [{ _id: "1", name: "Item 1", price: 100, description: "Item description" }]
    });
    expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully ");
  });

  it("should disable the payment button when loading", async () => {
    // arrange
    axios.post.mockResolvedValue({ data: {} });
    jest.spyOn(require('braintree-web-drop-in-react'), 'default').mockImplementation(({ onInstance }) => {
      return null;
    });
    // act
    await act(async () =>render(
      <Router>
        <CartPage />
      </Router>
    ));
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token"));
    const payButton = screen.getByText("Make Payment");
    await act(async () => {
      fireEvent.click(payButton);
    });
    // assert
    expect(payButton).toBeDisabled();
  });

});