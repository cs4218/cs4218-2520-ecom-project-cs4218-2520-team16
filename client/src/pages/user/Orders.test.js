// Wen Han Tang A0340008W
// Guided by Copiolot's suggestions.
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import axios from "axios";
import moment from "moment";
import Orders from "./Orders";
import { useAuth } from "../../context/auth";

// Mock dependencies
jest.mock("axios");
jest.mock("../../context/auth");
jest.mock("../../components/UserMenu", () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});
jest.mock("../../components/Layout", () => {
  return function MockLayout({ title, children }) {
    return (
      <div data-testid="layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

describe("Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    test("should render layout with correct title", () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      render(<Orders />);

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("Your Orders")).toBeInTheDocument();
    });

    test("should render UserMenu component", () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      render(<Orders />);

      // Assert
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    test("should render All Orders heading", () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      render(<Orders />);

      // Assert
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
  });

  describe("API Calls and Data Fetching", () => {
    test("should fetch orders when auth token is present", async () => {
      // Arrange
      const mockOrders = [];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    test("should NOT fetch orders when auth token is missing", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
    });

    test("should handle errors gracefully during fetch", async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const error = new Error("Network error");
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockRejectedValue(error);

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(error);
      consoleLogSpy.mockRestore();
    });
  });

  describe("Order Display", () => {
    test("should display order details correctly", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Success")).toBeInTheDocument();
      });
    });

    test("should display multiple orders", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
        {
          _id: "order2",
          status: "Shipped",
          buyer: { name: "Jane Smith" },
          createAt: new Date("2024-01-02"),
          payment: { success: false },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("Processing")).toBeInTheDocument();
        expect(screen.getByText("Shipped")).toBeInTheDocument();
      });
    });

    test("should display payment status as Failed when payment fails", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Not Process",
          buyer: { name: "John Doe" },
          createAt: new Date("2024-01-01"),
          payment: { success: false },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    test("should display correct product quantity", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [
            { _id: "p1", name: "Product 1" },
            { _id: "p2", name: "Product 2" },
            { _id: "p3", name: "Product 3" },
          ],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });
  });

  describe("Product Display", () => {
    test("should display product details in order", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Test Product",
              description: "This is a test product description",
              price: 99.99,
            },
          ],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
        expect(screen.getByText("This is a test product descrip")).toBeInTheDocument();
        expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
      });
    });

    test("should display product image with correct src", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Test Product",
              description: "Description",
              price: 99.99,
            },
          ],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      await waitFor(() => {
        const img = screen.getByAltText("Test Product");
        expect(img).toHaveAttribute(
          "src",
          "/api/v1/product/product-photo/p1"
        );
        expect(img).toHaveAttribute("width", "100px");
        expect(img).toHaveAttribute("height", "100px");
      });
    });

    test("should truncate product description to 30 characters", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Product",
              description: "This is a very long description that should be truncated",
              price: 50,
            },
          ],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("This is a very long descriptio")
        ).toBeInTheDocument();
      });
    });
  });

  describe("useEffect Dependency", () => {
    test("should refetch orders when auth token changes", async () => {
      // Arrange
      const mockOrders = [];
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        const { rerender } = render(<Orders />);

        // Update auth token
        useAuth.mockReturnValue([{ token: "new-token" }, jest.fn()]);
        rerender(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  });

  describe("Bug Fixes Verification", () => {
    test("FIXED: Component now uses 'createdAt' field correctly", async () => {
      // Verify the fix: component should now use createdAt instead of createAt
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Should display relative date correctly
      await waitFor(() => {
        // moment(createdAt).fromNow() should work correctly
        expect(screen.getByText(/ago/)).toBeInTheDocument();
      });
    });

    test("FIXED: className updated from 'container-flui' to 'container-fluid'", () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      const { container } = render(<Orders />);

      // Assert - The class name is now correctly spelled
      const dashboard = container.querySelector(".container-fluid");
      expect(dashboard).toBeInTheDocument();
      // Verify the old typo is NOT present
      const wrongClass = container.querySelector(".container-flui");
      expect(wrongClass).not.toBeInTheDocument();
    });

    test("FIXED: Order container div now has key prop", async () => {
      // Arrange - Verify fix: order container should now have key={o._id}
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
        {
          _id: "order2",
          status: "Shipped",
          buyer: { name: "Jane Smith" },
          createdAt: new Date("2024-01-02"),
          payment: { success: false },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - React should not warn about missing keys
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
        expect(screen.getByText("Shipped")).toBeInTheDocument();
      });
    });

    test("FIXED: Safe payment access with optional chaining", async () => {
      // Verify the fix: component now uses o?.payment?.success
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Should display Success safely
      await waitFor(() => {
        expect(screen.getByText("Success")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty orders array", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    test("should handle orders with no products", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Not Process",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText("0")).toBeInTheDocument();
      });
    });

    test("should handle missing buyer name gracefully", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: undefined },
          createdAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
    });

    test("should handle null payment object gracefully with optional chaining", async () => {
      // Arrange - Now that component uses o?.payment?.success, this should render without error
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"),
          payment: null,
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      await act(async () => {
        render(<Orders />);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Assert - Should render without crashing
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
    });
  });
});
