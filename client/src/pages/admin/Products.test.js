// Written by Roger Yao (A0340029N) with the help of Copilot.

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

  // =============== View Products List Integration Tests ===============
  // Based on section 7 - Admin Product Management from IntegrationTestIdeas.md

  describe("View Products List - Integration Tests", () => {
    test("should fetch all products from API on mount", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
        { _id: "2", name: "Product 2", description: "Desc 2", slug: "prod-2" },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    test("should fetch all products without pagination limit", async () => {
      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Product ${i + 1}`,
        description: `Desc ${i + 1}`,
        slug: `prod-${i + 1}`,
      }));
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("product-link")).toHaveLength(5);
      });
    });

    test("should display products as grid with photo, name, and description", async () => {
      const mockProducts = [
        {
          _id: "1",
          name: "Laptop",
          description: "High-performance laptop",
          slug: "laptop",
        },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Laptop")).toBeInTheDocument();
        expect(screen.getByText("High-performance laptop")).toBeInTheDocument();
        expect(screen.getByAltText("Laptop")).toBeInTheDocument();
      });
    });

    test("should display product image with correct endpoint", async () => {
      const mockProducts = [
        { _id: "123", name: "Product 1", description: "Desc 1", slug: "prod-1" },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const img = screen.getByAltText("Product 1");
        expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/123");
      });
    });

    test("should load product photos correctly for each item", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
        { _id: "2", name: "Product 2", description: "Desc 2", slug: "prod-2" },
        { _id: "3", name: "Product 3", description: "Desc 3", slug: "prod-3" },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const img1 = screen.getByAltText("Product 1");
        const img2 = screen.getByAltText("Product 2");
        const img3 = screen.getByAltText("Product 3");

        expect(img1).toHaveAttribute("src", "/api/v1/product/product-photo/1");
        expect(img2).toHaveAttribute("src", "/api/v1/product/product-photo/2");
        expect(img3).toHaveAttribute("src", "/api/v1/product/product-photo/3");
      });
    });

    test("should navigate to UpdateProduct page when clicking product card", async () => {
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

    test("should link each product card to its update page with correct slug", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", description: "Desc 1", slug: "laptop-pro" },
        { _id: "2", name: "Product 2", description: "Desc 2", slug: "tablet-mini" },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const links = screen.getAllByTestId("product-link");
        expect(links[0]).toHaveAttribute(
          "href",
          "/dashboard/admin/product/laptop-pro"
        );
        expect(links[1]).toHaveAttribute(
          "href",
          "/dashboard/admin/product/tablet-mini"
        );
      });
    });

    test("should display product in card format with proper structure", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", description: "Desc 1", slug: "prod-1" },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const card = screen.getByText("Product 1").closest(".card");
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass("card", "m-2");
        expect(card).toHaveStyle({ width: "18rem" });
      });
    });

    test("should handle multiple products in product list", async () => {
      const mockProducts = Array.from({ length: 12 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Product ${i + 1}`,
        description: `Description ${i + 1}`,
        slug: `product-${i + 1}`,
      }));
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("product-link")).toHaveLength(12);
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 12")).toBeInTheDocument();
      });
    });

    test("should display all products in a flex container", async () => {
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
        const flexContainer = screen.getByText("Product 1").closest(".d-flex");
        expect(flexContainer).toBeInTheDocument();
        expect(flexContainer).toHaveClass("d-flex");
      });
    });

    test("should display page title 'All Products List'", async () => {
      axios.get.mockResolvedValue({ data: { products: [] } });

      render(<Products />);

      expect(screen.getByText("All Products List")).toBeInTheDocument();
    });

    test("should render with Layout and AdminMenu", async () => {
      axios.get.mockResolvedValue({ data: { products: [] } });

      render(<Products />);

      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    test("should handle product with special characters in name", async () => {
      const mockProducts = [
        { _id: "1", name: "Product & Special #1", description: "Desc", slug: "prod-1" },
      ];
      axios.get.mockResolvedValue({ data: { products: mockProducts } });

      await act(async () => {
        render(<Products />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByText("Product & Special #1")).toBeInTheDocument();
      });
    });
  });
});
