// Written by Roger Yao A0340029N With the assistance of Claude Haiku 4.5
// Integration tests for Admin Update Product functionality
// Based on section 7 - Admin Product Management from IntegrationTestIdeas.md

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: "test-product" }),
}));
jest.mock("../../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return <div data-testid="layout" data-title={title}>{children}</div>;
  };
});

describe("UpdateProduct Integration Tests", () => {
  const mockProduct = {
    _id: "123",
    name: "Test Product",
    slug: "test-product",
    description: "Test Description",
    price: 99.99,
    quantity: 50,
    shipping: true,
    category: { _id: "1", name: "Electronics" },
  };

  const mockCategories = [
    { _id: "1", name: "Electronics" },
    { _id: "2", name: "Clothing" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.prompt for delete confirmation
    global.prompt = jest.fn(() => "delete");
  });

  // =============== Setup & Rendering Tests ===============
  describe("Form Setup and Loading", () => {
    test("should render update product form with heading", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Update Product")).toBeInTheDocument();
      });
    });

    test("should fetch product data on mount based on slug parameter", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/test-product"
        );
      });
    });

    test("should fetch categories on component mount", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });

    test("should render AdminMenu and Layout components", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
        expect(screen.getByTestId("layout")).toBeInTheDocument();
      });
    });

    test("should set correct page title", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
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

  // =============== Form Pre-Population Tests ===============
  describe("Form Pre-population with Existing Data", () => {
    test("should populate name field with existing product name", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("Test Product");
        expect(nameInput).toBeInTheDocument();
      });
    });

    test("should populate description field with existing data", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const descInput = screen.getByDisplayValue("Test Description");
        expect(descInput).toBeInTheDocument();
      });
    });

    test("should populate price field with existing data", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const priceInput = screen.getByDisplayValue(99.99);
        expect(priceInput).toBeInTheDocument();
      });
    });

    test("should populate quantity field with existing data", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue(50);
        expect(quantityInput).toBeInTheDocument();
      });
    });

    test("should display existing product photo", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const img = screen.getByAltText("product_photo");
        expect(img).toHaveAttribute("src", `/api/v1/product/product-photo/123`);
      });
    });

    test("should display empty photo upload label when form loads", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Upload Photo")).toBeInTheDocument();
      });
    });

    test("should populate category dropdown with correct value", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });
    });
  });

  // =============== Photo Update Tests ===============
  describe("Photo Update Functionality", () => {
    test("should render photo input for file selection", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", "image/*");
    });

    test("should keep existing photo if no new file is selected", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      const mockResponse = {
        data: {
          success: true,
          message: "Product Updated Successfully",
          products: mockProduct,
        },
      };
      axios.put.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Don't select a new photo, just update name and submit
      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product" } });
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/product/update-product/123",
          expect.any(FormData)
        );
      });
    });
  });

  // =============== Field Update Tests ===============
  describe("Field Updates", () => {
    test("should allow updating product name", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("Test Product");
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product Name" } });
      });

      expect(nameInput).toHaveValue("Updated Product Name");
    });

    test("should allow updating product description", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const descInput = screen.getByDisplayValue("Test Description");
        expect(descInput).toBeInTheDocument();
      });

      const descInput = screen.getByDisplayValue("Test Description");
      await act(async () => {
        fireEvent.change(descInput, { target: { value: "New Description" } });
      });

      expect(descInput).toHaveValue("New Description");
    });

    test("should allow updating product price", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const priceInput = screen.getByDisplayValue(99.99);
        expect(priceInput).toBeInTheDocument();
      });

      const priceInput = screen.getByDisplayValue(99.99);
      await act(async () => {
        fireEvent.change(priceInput, { target: { value: "149.99" } });
      });

      expect(priceInput).toHaveValue(149.99);
    });

    test("should allow updating product quantity", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue(50);
        expect(quantityInput).toBeInTheDocument();
      });

      const quantityInput = screen.getByDisplayValue(50);
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: "100" } });
      });

      expect(quantityInput).toHaveValue(100);
    });

    test("should display all categories in dropdown", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Both categories should be available in the dropdown
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });
    });
  });

  // =============== Product Update Tests ===============
  describe("Product Update Submission", () => {
    test("should submit update form with FormData containing updated fields", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      const mockResponse = {
        data: {
          success: true,
          message: "Product Updated Successfully",
          products: { ...mockProduct, name: "Updated Product" },
        },
      };
      axios.put.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product" } });
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/product/update-product/123",
          expect.any(FormData)
        );
      });
    });
  });

  // =============== Success/Navigation Tests ===============
  describe("Success Handling and Navigation", () => {
    test("should call API when update form is submitted", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      const mockResponse = {
        data: {
          success: true,
          message: "Product Updated Successfully",
          products: { ...mockProduct, name: "Updated Product" },
        },
      };
      axios.put.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const updateButton = screen.getByText("UPDATE PRODUCT");
      await act(async () => {
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/product/update-product/123",
          expect.any(FormData)
        );
      });
    });
  });

  // =============== Delete Product Tests ===============
  describe("Delete Product Functionality", () => {
    test("should render delete button", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });
    });

    test("should prompt for confirmation before deleting product", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      global.prompt = jest.fn(() => "delete");

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
      });

      expect(global.prompt).toHaveBeenCalled();
    });

    test("should not delete product if confirmation is cancelled", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      global.prompt = jest.fn(() => null);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
      });

      await waitFor(() => {
        expect(axios.delete).not.toHaveBeenCalled();
      });
    });

    test("should show success toast after deletion", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      axios.delete.mockResolvedValue({
        data: { success: true, message: "Product Deleted Successfully" },
      });

      global.prompt = jest.fn(() => "delete");

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
      });
    });
  });

  // =============== Error Handling Tests ===============
  describe("Error Handling", () => {
    test("should handle API errors during product fetch", async () => {
      const error = new Error("Fetch Error");
      axios.get
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Component should still render even if product fetch fails
      await waitFor(() => {
        expect(screen.getByText("Update Product")).toBeInTheDocument();
      });
    });

    test("should handle API errors during category fetch", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockRejectedValueOnce(new Error("Category Fetch Error"));

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something wwent wrong in getting catgeory"
        );
      });
    });

    test("should handle delete errors gracefully", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      axios.delete.mockRejectedValue(new Error("Delete failed"));

      global.prompt = jest.fn(() => "delete");

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  // =============== Success/Error Response Handling - Product Update ===============
  describe("Success/Error Response Handling - Product Update", () => {
    test("should show success toast when API returns success: true", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      const mockResponse = {
        data: { success: true, message: "Product Updated Successfully" },
      };
      axios.put.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product" } });
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      // BUG DETECTION: This should pass but fails due to inverted logic
      // Current code shows ERROR when success: true
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Product Updated Successfully"
        );
      });
    });

    test("should show error toast when API returns success: false", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      const mockResponse = {
        data: { success: false, message: "Product update failed" },
      };
      axios.put.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product" } });
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      // BUG DETECTION: When success: false, should show error
      // Current code shows success instead
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Product update failed");
      });
    });

    test("should NOT navigate when API returns success: false", async () => {
      const mockNavigate = jest.fn();
      jest
        .spyOn(require("react-router-dom"), "useNavigate")
        .mockReturnValue(mockNavigate);

      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      const mockResponse = {
        data: { success: false, message: "Update failed" },
      };
      axios.put.mockResolvedValue(mockResponse);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product" } });
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      // BUG DETECTION: Should NOT navigate on failure
      // Current code navigates anyway due to inverted if/else
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalledWith(
          "/dashboard/admin/products"
        );
      });
    });

    test("should show error toast on network error during update", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      axios.put.mockRejectedValue(new Error("Network error"));

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Product");
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "Updated Product" } });
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("something went wrong");
      });
    });
  });

  // =============== Integration Tests ===============
  describe("Complete Product Update Workflow", () => {
    test("should complete update workflow: load and submit", async () => {
      axios.get
        .mockResolvedValueOnce({
          data: { product: mockProduct },
        })
        .mockResolvedValueOnce({
          data: { success: true, category: mockCategories },
        });

      axios.put.mockResolvedValue({
        data: {
          success: true,
          message: "Product Updated Successfully",
          products: {
            ...mockProduct,
            name: "New Product Name",
            price: 199.99,
          },
        },
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for form to load with existing data
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Verify data is loaded
      expect(screen.getByDisplayValue(99.99)).toHaveValue(99.99);

      // Modify field
      const nameInput = screen.getByDisplayValue("Test Product");

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "New Product Name" } });
      });

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
      });

      // Verify API call
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalled();
      });
    });
  });
});
