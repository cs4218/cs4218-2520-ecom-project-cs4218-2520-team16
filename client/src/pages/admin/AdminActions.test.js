// Written by Roger Yao with the help of Copilot

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import UpdateProduct from "./UpdateProduct";
import CreateCategory from "./CreateCategory";

const mockNavigate = jest.fn();
const mockParams = { slug: "test-slug" };

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});
jest.mock("../../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});
jest.mock("../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

jest.mock("../../components/Form/CategoryForm", () => {
  return function MockCategoryForm({ value, setValue, handleSubmit }) {
    return (
      <form onSubmit={handleSubmit}>
        <input
          aria-label="category-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    );
  };
});

jest.mock("antd", () => {
  const MockOption = ({ children, value }) => {
    return <option value={value}>{children}</option>;
  };

  const MockSelect = ({ children, onChange, value, placeholder }) => {
    const testId = placeholder
      ? `select-${placeholder.trim().toLowerCase().replace(/\s+/g, "-")}`
      : "select";
    return (
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    );
  };

  MockSelect.Option = MockOption;

  const MockModal = ({ visible, children }) => {
    if (!visible) return null;
    return <div data-testid="modal">{children}</div>;
  };

  return {
    Select: MockSelect,
    Modal: MockModal,
  };
});

describe("AdminActions - CreateProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "blob:preview");
  });

  test("renders layout title, admin menu, and heading", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });

    // Act
    render(<CreateProduct />);

    // Assert
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Dashboard - Create Product"
    );
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Create Product" })
    ).toBeInTheDocument();
  });

  test("fetches categories on mount and renders options", async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "cat-1", name: "Category One" },
          { _id: "cat-2", name: "Category Two" },
        ],
      },
    });

    // Act
    await act(async () => {
      render(<CreateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    expect(screen.getByText("Category One")).toBeInTheDocument();
    expect(screen.getByText("Category Two")).toBeInTheDocument();
  });

  test("shows toast error when category fetch fails", async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error("Network error"));

    // Act
    await act(async () => {
      render(<CreateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "Something wwent wrong in getting catgeory"
    );
  });

  test("updates photo label and renders preview image when photo is selected", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });
    const file = new File(["photo"], "photo.png", { type: "image/png" });

    // Act
    render(<CreateProduct />);
    const input = screen.getByLabelText("Upload Photo");
    await userEvent.upload(input, file);

    // Assert
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.getByAltText("product_photo")).toHaveAttribute(
      "src",
      "blob:preview"
    );
  });

  test("submits form data and navigates on create", async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
    });
    axios.post.mockResolvedValue({ data: { success: true } });

    // Act
    await act(async () => {
      render(<CreateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.type(screen.getByPlaceholderText("write a name"), "Phone");
    await userEvent.type(
      screen.getByPlaceholderText("write a description"),
      "A new phone"
    );
    await userEvent.type(screen.getByPlaceholderText("write a Price"), "99");
    await userEvent.type(screen.getByPlaceholderText("write a quantity"), "4");
    await userEvent.selectOptions(
      screen.getByTestId("select-select-a-category"),
      "cat-1"
    );

    await userEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/create-product",
        expect.any(FormData)
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  test("shows error toast when create fails", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });
    axios.post.mockReturnValue({
      data: { success: true, message: "Create failed" },
    });

    // Act
    await act(async () => {
      render(<CreateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Create failed");
    });
  });
});

describe("AdminActions - UpdateProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "blob:preview");
  });

  const mockProductResponse = {
    data: {
      product: {
        _id: "prod-1",
        name: "Phone",
        description: "A phone",
        price: 99,
        quantity: 5,
        shipping: true,
        category: { _id: "cat-1" },
      },
    },
  };

  const mockCategoryResponse = {
    data: {
      success: true,
      category: [
        { _id: "cat-1", name: "Category One" },
        { _id: "cat-2", name: "Category Two" },
      ],
    },
  };

  const mockGet = (url) => {
    if (url.startsWith("/api/v1/product/get-product/")) {
      return Promise.resolve(mockProductResponse);
    }
    if (url === "/api/v1/category/get-category") {
      return Promise.resolve(mockCategoryResponse);
    }
    return Promise.resolve({ data: {} });
  };

  test("renders layout, admin menu, and heading", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Dashboard - Create Product"
    );
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Update Product" })
    ).toBeInTheDocument();
  });

  test("fetches product and populates form fields", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/test-slug"
    );
    expect(screen.getByDisplayValue("Phone")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A phone")).toBeInTheDocument();
    expect(screen.getByDisplayValue("99")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  test("renders product image when no new photo is selected", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    const img = screen.getByAltText("product_photo");
    expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/prod-1");
  });

  test("renders preview image when new photo is selected", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);
    const file = new File(["photo"], "photo.png", { type: "image/png" });

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const input = screen.getByLabelText("Upload Photo");
    await userEvent.upload(input, file);

    // Assert
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.getByAltText("product_photo")).toHaveAttribute(
      "src",
      "blob:preview"
    );
  });

  test("updates product and navigates on success", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);
    axios.put.mockResolvedValue({ data: { success: true } });

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.clear(screen.getByPlaceholderText("write a name"));
    await userEvent.type(screen.getByPlaceholderText("write a name"), "Phone X");
    await userEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/prod-1",
        expect.any(FormData)
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  test("shows error toast when update fails", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);
    axios.put.mockReturnValue({
      data: { success: true, message: "Update failed" },
    });

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  test("deletes product after confirmation and navigates", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);
    axios.delete.mockResolvedValue({ data: { success: true } });
    jest.spyOn(window, "prompt").mockReturnValue("yes");

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/product/delete-product/prod-1"
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    window.prompt.mockRestore();
  });

  test("does not delete when confirmation is cancelled", async () => {
    // Arrange
    axios.get.mockImplementation(mockGet);
    jest.spyOn(window, "prompt").mockReturnValue("");

    // Act
    await act(async () => {
      render(<UpdateProduct />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

    // Assert
    expect(axios.delete).not.toHaveBeenCalled();
    window.prompt.mockRestore();
  });
});

describe("AdminActions - CreateCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders layout title, admin menu, and heading", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });

    // Act
    render(<CreateCategory />);

    // Assert
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Dashboard - Create Category"
    );
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Manage Category" })
    ).toBeInTheDocument();
  });

  test("fetches categories on mount and renders table rows", async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "cat-1", name: "Category One" },
          { _id: "cat-2", name: "Category Two" },
        ],
      },
    });

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    expect(screen.getByText("Category One")).toBeInTheDocument();
    expect(screen.getByText("Category Two")).toBeInTheDocument();
  });

  test("creates category and refreshes list on success", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
      })
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
      });
    axios.post.mockResolvedValue({ data: { success: true } });

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const input = screen.getByLabelText("category-name");
    await userEvent.type(input, "New Category");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "New Category" }
      );
    });
    expect(toast.success).toHaveBeenCalledWith("New Category is created");
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("shows error toast when create fails", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { success: true, category: [] } });
    axios.post.mockResolvedValue({ data: { success: false, message: "Bad" } });

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.type(screen.getByLabelText("category-name"), "Bad");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Bad");
    });
  });

  test("updates category through modal and refreshes list", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
      })
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
      });
    axios.put.mockResolvedValue({ data: { success: true } });

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    const inputs = screen.getAllByLabelText("category-name");
    const modalInput = inputs[inputs.length - 1];
    await userEvent.clear(modalInput);
    await userEvent.type(modalInput, "Updated Category");
    await userEvent.click(screen.getAllByRole("button", { name: "Submit" })[1]);

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/cat-1",
        { name: "Updated Category" }
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Updated Category is updated");
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("deletes category and refreshes list", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
      })
      .mockResolvedValueOnce({
        data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
      });
    axios.delete.mockResolvedValue({ data: { success: true } });

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Assert
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/cat-1"
      );
    });
    expect(toast.success).toHaveBeenCalledWith("category is deleted");
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("shows error toast when update fails", async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
    });
    axios.put.mockRejectedValue(new Error("fail"));

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Submit" })[1]);

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  test("shows error toast when delete fails", async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "cat-1", name: "Category One" }] },
    });
    axios.delete.mockRejectedValue(new Error("fail"));

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  test("shows error toast when fetch fails", async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error("fail"));

    // Act
    await act(async () => {
      render(<CreateCategory />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(toast.error).toHaveBeenCalledWith(
      "Something wwent wrong in getting catgeory"
    );
  });
});
