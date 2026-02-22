// Xiao Ao, A0273305L
// Code guided by github Copilot

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-wait-for-multiple-assertions */
/* eslint-disable testing-library/no-node-access */

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import Login from "./Login";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("../../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

const { useNavigate, useLocation } = require("react-router-dom");

describe("Login Component", () => {
  const mockNavigate = jest.fn();
  const mockSetAuth = jest.fn();
  const mockAuth = { user: null, token: "" };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([mockAuth, mockSetAuth]);
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({
      state: null,
      pathname: "/login",
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders Login component with form elements", () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /LOGIN/i })).toBeInTheDocument();
  });

  test("renders Forgot Password button and navigates on click", async () => {
    // Arrange
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    const forgotPasswordBtn = screen.getByRole("button", {
      name: /Forgot Password/i,
    });
    expect(forgotPasswordBtn).toBeInTheDocument();

    // Act
    await act(async () => {
      await userEvent.click(forgotPasswordBtn);
    });

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
    });
  });

  test("updates email input value on change", async () => {
    // Arrange
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
    });

    // Assert
    expect(emailInput.value).toBe("test@example.com");
  });

  test("updates password input value on change", async () => {
    // Arrange
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    const passwordInputs = document.querySelector('input[type="password"]');

    // Act
    await act(async () => {
      await userEvent.type(passwordInputs, "password123");
    });

    // Assert
    expect(passwordInputs.value).toBe("password123");
  });

  test("displays success message and navigates on successful login", async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        message: "Login successful",
        user: { id: 1, email: "test@example.com" },
        token: "mock-token",
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    toast.success = jest.fn();

    await act(async () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
    });

    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const submitButton = screen.getByRole("button", { name: /LOGIN/i });

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);
    });

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(mockSetAuth).toHaveBeenCalledWith({
        ...mockAuth,
        user: mockResponse.data.user,
        token: mockResponse.data.token,
      });
    });
  });

  test("saves auth data to localStorage on successful login", async () => {
    // Arrange  
    const mockResponse = {
      data: {
        success: true,
        message: "Login successful",
        user: { id: 1, email: "test@example.com" },
        token: "mock-token",
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    toast.success = jest.fn();

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const submitButton = screen.getByRole("button", { name: /LOGIN/i });

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);
    });

    // Assert
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        "auth",
        JSON.stringify(mockResponse.data)
      );
    });

    setItemSpy.mockRestore();
  });

  test("handles email and password validation (required fields)", async () => {
    // Act
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Assert
    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");

    expect(emailInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("required");
  });

  test("displays error message on failed login", async () => {
    // Arrange
    const errorMessage = "Invalid email or password";
    const mockResponse = {
      data: {
        success: false,
        message: errorMessage,
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    toast.error = jest.fn();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const submitButton = screen.getByRole("button", { name: /LOGIN/i });

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "wrongpassword");
      await userEvent.click(submitButton);
    });

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  test("displays default error message when error message is missing", async () => {
    const mockResponse = {
      data: {
        success: false,
        message: undefined, // No error message provided
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    toast.error = jest.fn();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const submitButton = screen.getByRole("button", { name: /LOGIN/i });

    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "wrongpassword");
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Login failed");
    });
  });

  test("displays error message on network error", async () => {
    // Arrange
    const mockError = new Error("Network Error");
    axios.post.mockRejectedValue(mockError);
    toast.error = jest.fn();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const submitButton = screen.getByRole("button", { name: /LOGIN/i });

    // Act
    await act(async () => {
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);
    });

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("renders with correct page title in Layout", () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Assert
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute(
      "data-title",
      "Login - Ecommerce App"
    );
  });

  test("email input has autoFocus attribute", () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Assert
    const inputs = container.querySelectorAll("input[type='email']");
    expect(inputs.length).toBeGreaterThan(0);
    // Check if email input has tabIndex -1 which is set for autoFocus elements, or direct check
    const emailInput = inputs[0];
    const hasAutoFocusLike = emailInput.hasAttribute("autoFocus") || document.activeElement === emailInput;
    expect(hasAutoFocusLike || emailInput.autofocus).toBeTruthy();
  });

  test("form has correct CSS class for styling", () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Assert
    const formContainer = container.querySelector(".form-container");
    expect(formContainer).toBeInTheDocument();
    expect(formContainer).toHaveStyle("minHeight: 90vh");
  });

    test("prevents default form submission behavior", async () => {
      // Arrange
      axios.post.mockResolvedValue({
        data: { success: true, message: "Login successful" },
      });
      toast.success = jest.fn();

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const form = screen.getByRole("button", { name: /LOGIN/i }).closest("form");
      const submitEvent = new Event("submit", { bubbles: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, "preventDefault");

      // Act
      form.dispatchEvent(submitEvent);

      // Assert
      await waitFor(() => {
        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });
});