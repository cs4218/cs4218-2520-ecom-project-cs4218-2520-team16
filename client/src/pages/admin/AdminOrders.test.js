import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOrders from "./AdminOrders";
import axios from "axios";
jest.mock("axios");
import toast from "react-hot-toast";
jest.mock("react-hot-toast");
import * as authContext from "../../context/auth";
import moment from "moment";

const mockOrders = [
  {
    _id: "order1",
    status: "Processing",
    buyer: { name: "Alice" },
    createAt: "2026-02-20T10:00:00Z",
    payment: { success: true },
    products: [
      {
        _id: "prod1",
        name: "Product 1",
        description: "A great product for testing purposes.",
        price: 100,
      },
      {
        _id: "prod2",
        name: "Product 2",
        description: "Another test product.",
        price: 200,
      },
    ],
  },
  {
    _id: "order2",
    status: "Not Process",
    buyer: { name: "Bob" },
    createAt: "2026-02-19T12:00:00Z",
    payment: { success: false },
    products: [
      {
        _id: "prod3",
        name: "Product 3",
        description: "Third product.",
        price: 300,
      },
    ],
  },
];

describe("AdminOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(authContext, "useAuth").mockReturnValue([{ token: "test-token" }, jest.fn()]);
  });

  it("renders all orders and their details", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
    // Check order details
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getAllByText("Success").length).toBe(1);
    expect(screen.getAllByText("Failed").length).toBe(1);
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.getByText("Product 3")).toBeInTheDocument();
    expect(screen.getByText("Price : 100")).toBeInTheDocument();
    expect(screen.getByText("Price : 200")).toBeInTheDocument();
    expect(screen.getByText("Price : 300")).toBeInTheDocument();
  });

  it("calls getOrders only if auth token exists", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
  });

  it("handles order status change", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: {} });
    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "Shipped" } });
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", { status: "Shipped" });
      expect(axios.get).toHaveBeenCalledTimes(2); // getOrders called again
    });
  });

  it("renders empty state if no orders", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("handles axios errors gracefully", async () => {
    const error = new Error("Network error");
    axios.get.mockRejectedValueOnce(error);
    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
    // No orders rendered
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });
});
