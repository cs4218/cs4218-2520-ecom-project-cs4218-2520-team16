import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props} data-testid="product-link">
        {children}
      </a>
    ),
  };
});

describe("Products Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders layout and admin menu", () => {
    axios.get.mockResolvedValue({ data: { products: [] } });
    render(<Products />);
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  test("renders heading", () => {
    axios.get.mockResolvedValue({ data: { products: [] } });
    render(<Products />);
    expect(screen.getByText("All Products List")).toBeInTheDocument();
  });

  test("fetches products on mount", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });
    await act(async () => {
      render(<Products />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
  });

  test("renders product cards", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
      { _id: "2", name: "Product 2", description: "Desc 2", slug: "prod-2" },
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });
    await act(async () => {
      render(<Products />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getAllByTestId("product-link")).toHaveLength(2);
    });
  });

  test("renders product image and description", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });
    await act(async () => {
      render(<Products />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    await waitFor(() => {
      const img = screen.getByAltText("Product 1");
      expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/1");
      expect(screen.getByText("Desc 1")).toBeInTheDocument();
    });
  });

  test("links to correct product detail page", async () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });
    await act(async () => {
      render(<Products />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    await waitFor(() => {
      const link = screen.getByTestId("product-link");
      expect(link).toHaveAttribute("href", "/dashboard/admin/product/prod-1");
    });
  });

  test("handles API error gracefully", async () => {
    const error = new Error("Network error");
    axios.get.mockRejectedValue(error);
    await act(async () => {
      render(<Products />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
  });

  test("renders no products when API returns empty array", async () => {
    axios.get.mockResolvedValue({ data: { products: [] } });
    await act(async () => {
      render(<Products />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(screen.queryAllByTestId("product-link")).toHaveLength(0);
  });
});
