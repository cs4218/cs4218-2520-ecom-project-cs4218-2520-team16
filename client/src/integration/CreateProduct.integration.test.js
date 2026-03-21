// Written by Roger Yao A0340029N With the assistance of Claude Haiku 4.5
// Integration tests for Admin Create Product functionality
// Based on section 7 - Admin Product Management from IntegrationTestIdeas.md

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "../pages/admin/CreateProduct";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));
jest.mock("../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});
jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return <div data-testid="layout" data-title={title}>{children}</div>;
  };
});

describe("CreateProduct Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============== Setup & Rendering Tests ===============
  describe("Form Setup and Rendering", () => {
    test("should render create product form heading", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics" },
        { _id: "2", name: "Clothing" },
      ];
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Create Product")).toBeInTheDocument();
      });
    });

    test("should fetch categories on component mount", async () => {
      const mockCategories = [
        { _id: "1", name: "Electronics" },
        { _id: "2", name: "Clothing" },
      ];
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    test("should render AdminMenu and Layout components", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
        expect(screen.getByTestId("layout")).toBeInTheDocument();
      });
    });

    test("should set correct page title in Layout", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("layout")).toHaveAttribute(
          "data-title",
          "Dashboard - Create Product"
        );
      });
    });
  });

  // =============== File Upload Tests ===============
  describe("File Upload and Preview", () => {
    test("should show Upload Photo button initially", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      });
    });

    test("should have file input for photo selection", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", "image/*");
    });
  });

  // =============== Form Input & Submission Tests ===============
  describe("Form Input and Validation", () => {
    test("should allow entering product name", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      const nameInput = screen.getByPlaceholderText("write a name");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Test Product" } });
      });

      expect(nameInput).toHaveValue("Test Product");
    });

    test("should allow entering product description", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      const descInput = screen.getByPlaceholderText("write a description");
      await act(async () => {
        fireEvent.change(descInput, { target: { value: "Test Description" } });
      });

      expect(descInput).toHaveValue("Test Description");
    });

    test("should allow entering product price", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      const priceInput = screen.getByPlaceholderText("write a Price");
      await act(async () => {
        fireEvent.change(priceInput, { target: { value: "99.99" } });
      });

      expect(priceInput).toHaveValue(99.99);
    });

    test("should allow entering product quantity", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      const quantityInput = screen.getByPlaceholderText("write a quantity");
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: "50" } });
      });

      expect(quantityInput).toHaveValue(50);
    });
  });

  // =============== Product Creation Tests ===============
  describe("Product Creation Button and API", () => {
    test("should render CREATE PRODUCT button", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
      });
    });

    test("should make FormData POST request when button clicked", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
      });

      const mockResponse = {
        data: { success: true, message: "Product Created Successfully" },
      };
      axios.post.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
      });

      // Click create button
      await act(async () => {
        fireEvent.click(screen.getByText("CREATE PRODUCT"));
      });

      // Verify POST call made
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/create-product",
          expect.any(FormData)
        );
      });
    });
  });

  // =============== Response Logic Tests ===============
  describe("Success/Error Response Handling", () => {
    test("should show success toast when API returns success: true", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
      });

      const mockResponse = {
        data: { success: true, message: "Product Created Successfully" },
      };
      axios.post.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("CREATE PRODUCT"));
      });

      // BUG DETECTION: This should pass but fails due to inverted logic
      // Current code shows ERROR when success: true
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Product Created Successfully"
        );
      });
    });

    test("should show error toast when API returns success: false", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
      });

      const mockResponse = {
        data: { success: false, message: "Product creation failed" },
      };
      axios.post.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("CREATE PRODUCT"));
      });

      // BUG DETECTION: When success: false, should show error
      // Current code shows success instead
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Product creation failed");
      });
    });

    test("should NOT navigate when API returns success: false", async () => {
      const mockNavigate = jest.fn();
      jest
        .spyOn(require("react-router-dom"), "useNavigate")
        .mockReturnValue(mockNavigate);

      axios.get.mockResolvedValue({
        data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
      });

      const mockResponse = {
        data: { success: false, message: "Creation failed" },
      };
      axios.post.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("CREATE PRODUCT"));
      });

      // BUG DETECTION: Should NOT navigate on failure
      // Current code navigates anyway due to inverted if/else
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalledWith(
          "/dashboard/admin/products"
        );
      });
    });
  });

  // =============== Error Handling Tests ===============
  describe("Error Handling", () => {
    test("should handle category fetch errors", async () => {
      const error = new Error("Category Fetch Error");
      axios.get.mockRejectedValue(error);

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something wwent wrong in getting catgeory"
        );
      });
    });

    test("should show error toast on network error during create", async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
      });

      axios.post.mockRejectedValue(new Error("Network error"));

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("CREATE PRODUCT"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("something went wrong");
      });
    });
  });
});
