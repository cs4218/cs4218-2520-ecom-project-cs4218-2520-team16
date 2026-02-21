// Roger Yao, A0340029N
// Code guided by chatGPT
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminOrders from "../pages/Admin/AdminOrders"; // <-- change path
import axios from "axios";

// ---- mocks ----
jest.mock("axios");

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu" />);
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));

jest.mock("moment", () => {
  return () => ({
    fromNow: () => "2 days ago",
  });
});

const mockUseAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("antd", () => {
  const React = require("react");
  const Select = ({ onChange, defaultValue, children }) => (
    <select
      data-testid="status-select"
      defaultValue={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
  const Option = ({ value, children }) => <option value={value}>{children}</option>;
  return { Select, Option };
});

// ---- helpers ----
function makeOrder(overrides = {}) {
  return {
    _id: "order1",
    status: "Not Process",
    buyer: { name: "Alice" },
    createAt: "2025-01-01T00:00:00.000Z",
    payment: { success: true },
    products: [
      {
        _id: "p1",
        name: "Product One",
        description: "This is a long description for product one",
        price: 10,
      },
      {
        _id: "p2",
        name: "Product Two",
        description: "This is a long description for product two",
        price: 20,
      },
    ],
    ...overrides,
  };
}

describe("Tests for Admin Orders (AAA)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders orders when auth token exists", async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: [makeOrder()] });

    // Act
    render(<AdminOrders />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });

    expect(screen.getByTestId("layout-title")).toHaveTextContent("All Orders Data");
    expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("2 days ago")).toBeInTheDocument();

    expect(screen.getByText("Product One")).toBeInTheDocument();
    expect(screen.getByText("Product Two")).toBeInTheDocument();

    expect(screen.getByTestId("status-select")).toHaveValue("Not Process");
  });

  test("does NOT fetch orders when auth token is missing", async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

    // Act
    render(<AdminOrders />);

    // Assert
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  test("changing status calls PUT and refetches orders", async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({ data: [makeOrder({ _id: "order123" })] }); // initial fetch
    axios.put.mockResolvedValueOnce({ data: { success: true } }); // PUT success
    axios.get.mockResolvedValueOnce({
      data: [makeOrder({ _id: "order123", status: "Shipped" })],
    }); // refetch

    // Act
    render(<AdminOrders />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });

    fireEvent.change(screen.getByTestId("status-select"), {
      target: { value: "Shipped" },
    });

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order123", {
        status: "Shipped",
      });
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  test("logs error if fetching orders fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    // Act
    render(<AdminOrders />);

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test("logs error if updating status fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({ data: [makeOrder({ _id: "order123" })] });
    axios.put.mockRejectedValueOnce(new Error("PUT failed"));

    // Act
    render(<AdminOrders />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });

    fireEvent.change(screen.getByTestId("status-select"), {
      target: { value: "Processing" },
    });

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Should NOT refetch if PUT fails (your code only refetches inside try)
    expect(axios.get).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
