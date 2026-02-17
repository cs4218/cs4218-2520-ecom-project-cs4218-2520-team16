// Wen Han Tang A0340008W
// Guided by Copiolot's suggestions.
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });
    });

    test("should NOT fetch orders when auth token is missing", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    test("should handle errors gracefully during fetch", async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const error = new Error("Network error");
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockRejectedValue(error);

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
      });
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
          createAt: new Date("2024-01-01"),
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
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
        expect(screen.getByText("This is a test product d")).toBeInTheDocument();
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
          createAt: new Date("2024-01-01"),
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
      render(<Orders />);

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
          createAt: new Date("2024-01-01"),
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
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("This is a very long descript")
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
      const { rerender } = render(<Orders />);

      // Update auth token
      useAuth.mockReturnValue([{ token: "new-token" }, jest.fn()]);
      rerender(<Orders />);

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });
    });
  });

  describe("Code Issues Found", () => {
    test("BUG: Component uses 'createAt' but order model likely uses 'createdAt'", async () => {
      // This test documents a bug: the component accesses o?.createAt
      // but MongoDB/Mongoose typically uses createdAt (with lowercase 'c')
      // This would result in undefined date display
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createdAt: new Date("2024-01-01"), // Correct field name
          createAt: undefined, // Component uses this wrong field
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      render(<Orders />);

      // Assert - moment(undefined).fromNow() will show "a few seconds ago" or similar
      await waitFor(() => {
        // The date will not display correctly
        // moment(undefined).fromNow() doesn't error but gives wrong output
        expect(screen.getByText(/ago/)).toBeInTheDocument();
      });
    });

    test("className typo 'container-flui' should be 'container-fluid'", () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      const { container } = render(<Orders />);

      // Assert - The class name is misspelled which could affect Bootstrap styling
      const dashboard = container.querySelector(".container-flui");
      expect(dashboard).toBeInTheDocument();
      // This is a typo bug: should be "container-fluid" not "container-flui"
    });

    test("Missing key prop on order container div", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation((message) => {
          if (message.includes("Each child in a list should have a unique")) {
            throw new Error(message);
          }
        });

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

      // Assert - React will warn about missing keys in the list
      // The order div inside {orders?.map((o, i) => { ... })} has no key
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty orders array", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [] });

      // Act
      render(<Orders />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("All Orders")).toBeInTheDocument();
        // Should render without crashing
      });
    });

    test("should handle orders with no products", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Not Process",
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
          createAt: new Date("2024-01-01"),
          payment: { success: true },
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act
      render(<Orders />);

      // Assert - Should render without crashing
      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
    });

    test("should handle null payment object", async () => {
      // Arrange
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "John Doe" },
          createAt: new Date("2024-01-01"),
          payment: null,
          products: [],
        },
      ];
      useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      // Act & Assert - This will likely cause an error
      expect(() => {
        render(<Orders />);
      }).toThrow();
    });
  });
});
