// Roger Yao, A0340029N
// Code guided by chatGPT
import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

// mock moment so it’s deterministic
jest.mock("moment", () => {
  return () => ({
    fromNow: () => "2 days ago",
  });
});

// mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

/**
 * Mock antd Select/Option so we can fire a simple change event.
 * Your component uses:
 *   <Select onChange={(value) => handleChange(...)} defaultValue={...}>
 *     <Option value={s}>{s}</Option>
 *   </Select>
 */
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

describe("AdminOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and renders orders when auth token exists", async () => {
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: [makeOrder()] });

    render(<AdminOrders />);

    // should call GET when token exists
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });

    // Layout title rendered
    expect(screen.getByTestId("layout-title")).toHaveTextContent("All Orders Data");

    // Header rendered
    expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();

    // Buyer name, payment, quantity
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // quantity = products.length

    // Date rendered via mocked moment
    expect(screen.getByText("2 days ago")).toBeInTheDocument();

    // Product cards rendered
    expect(screen.getByText("Product One")).toBeInTheDocument();
    expect(screen.getByText("Product Two")).toBeInTheDocument();

    // Status select exists and default value is order status
    const select = screen.getByTestId("status-select");
    expect(select).toHaveValue("Not Process");
  });

  test("does NOT fetch orders when auth token is missing", async () => {
    mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

    render(<AdminOrders />);

    // Give effects a tick; ensure axios.get never called
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  test("changing status calls PUT and refetches orders", async () => {
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);

    // initial fetch
    axios.get.mockResolvedValueOnce({ data: [makeOrder({ _id: "order123" })] });

    // PUT success
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    // refetch after change
    axios.get.mockResolvedValueOnce({ data: [makeOrder({ _id: "order123", status: "Shipped" })] });

    render(<AdminOrders />);

    // Wait initial fetch render
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders"));

    const select = screen.getByTestId("status-select");
    fireEvent.change(select, { target: { value: "Shipped" } });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order123", {
        status: "Shipped",
      });
    });

    // After PUT, it should refetch orders
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  test("logs error if fetching orders fails", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);

    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(<AdminOrders />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test("logs error if updating status fails", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockUseAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({ data: [makeOrder({ _id: "order123" })] });
    axios.put.mockRejectedValueOnce(new Error("PUT failed"));

    render(<AdminOrders />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId("status-select"), {
      target: { value: "Processing" },
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Should NOT refetch if PUT fails (your code only refetches inside try)
    expect(axios.get).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});