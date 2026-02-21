import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
jest.mock("axios");
import axios from "axios";
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { } }));
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock("../../context/auth", () => ({ useAuth: () => [{ token: "test-token" }, jest.fn()] }));
import AdminOrders from "./AdminOrders";

const mockOrders = [
  {
    _id: "order1",
    status: "Processing",
    buyer: { name: "Alice" },
    createAt: new Date().toISOString(),
    payment: { success: true },
    products: [
      {
        _id: "prod1",
        name: "Product 1",
        description: "Description 1",
        price: 100,
      },
      {
        _id: "prod2",
        name: "Product 2",
        description: "Description 2",
        price: 200,
      },
    ],
  },
  {
    _id: "order2",
    status: "Not Process",
    buyer: { name: "Bob" },
    createAt: new Date().toISOString(),
    payment: { success: false },
    products: [
      {
        _id: "prod3",
        name: "Product 3",
        description: "Description 3",
        price: 300,
      },
    ],
  },
];

describe("AdminOrders Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockOrders });
    axios.put.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders layout and admin menu", async () => {
    render(<AdminOrders />);
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
  });

  it("fetches and displays orders", async () => {
    render(<AdminOrders />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
    // Check product details
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
    // Check payment status
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders correct status options for each order", async () => {
    render(<AdminOrders />);
    await waitFor(() => {
      // There should be Select elements for each order
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBe(mockOrders.length);
      // Check default values
      expect(selects[0]).toHaveTextContent("Processing");
      expect(selects[1]).toHaveTextContent("Not Process");
    });
  });

  it("calls API and updates status when changed", async () => {
    render(<AdminOrders />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    const selects = screen.getAllByRole("combobox");
    // Change status of first order
    fireEvent.change(selects[0], { target: { value: "Shipped" } });
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order1",
        { status: "Shipped" }
      );
      expect(axios.get).toHaveBeenCalledTimes(2); // getOrders called again
    });
  });

  it("displays product images with correct src", async () => {
    render(<AdminOrders />);
    await waitFor(() => {
      const imgs = screen.getAllByRole("img");
      expect(imgs[0]).toHaveAttribute("src", "/api/v1/product/product-photo/prod1");
      expect(imgs[1]).toHaveAttribute("src", "/api/v1/product/product-photo/prod2");
      expect(imgs[2]).toHaveAttribute("src", "/api/v1/product/product-photo/prod3");
    });
  });

  it("handles API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API error"));
    render(<AdminOrders />);
    await waitFor(() => {
      // Should not throw, but orders will not be displayed
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });
  });

  it("shows order quantity correctly", async () => {
    render(<AdminOrders />);
    await waitFor(() => {
      // Quantity column
      expect(screen.getByText("2")).toBeInTheDocument(); // First order
      expect(screen.getByText("1")).toBeInTheDocument(); // Second order
    });
  });

  it("renders moment date correctly", async () => {
    render(<AdminOrders />);
    await waitFor(() => {
      // Should show a relative date string
      const dateCells = screen.getAllByText(/ago$/);
      expect(dateCells.length).toBeGreaterThan(0);
    });
  });
});