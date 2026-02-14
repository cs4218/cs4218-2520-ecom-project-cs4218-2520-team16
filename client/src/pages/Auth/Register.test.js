// Xiao Ao, A0273305L
// Code guided by github Copilot

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-wait-for-multiple-assertions */
/* eslint-disable testing-library/no-node-access */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import Register from "./Register";
import { useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
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


describe("Register Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    // Mock window.matchMedia
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

  test("renders Register component with all form elements", () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(5); // name, email, phone, address, answer
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThan(0);
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /REGISTER/i })).toBeInTheDocument();
  });

  test("renders with correct page title in Layout", () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Assert
    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "Register - Ecommerce App");
  });

  test("updates form input values on change", async () => {
    // Arrange
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.id === "exampleInputName1");
    const emailInput = inputs.find((input) => input.type === "email");
    const phoneInput = inputs.find((input) => input.id === "exampleInputPhone1");

    // Act
    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(phoneInput, "1234567890");

    // Assert
    expect(nameInput.value).toBe("John Doe");
    expect(emailInput.value).toBe("john@example.com");
    expect(phoneInput.value).toBe("1234567890");
  });

  test("displays success message and navigates on successful registration", async () => {
    //  Arrange 
    const mockResponse = {
      data: {
        success: true,
        message: "Register Successfully, please login",
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    toast.success = jest.fn();

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.id === "exampleInputName1");
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const phoneInput = inputs.find((input) => input.id === "exampleInputPhone1");
    const addressInput = inputs.find((input) => input.id === "exampleInputaddress1");
    const dobInput = inputs.find((input) => input.type === "date");
    const answerInput = inputs.find((input) => input.id === "exampleInputanswer1");
    const submitButton = screen.getByRole("button", { name: /REGISTER/i });

    // Act
    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(phoneInput, "1234567890");
    await userEvent.type(addressInput, "123 Main St");
    await userEvent.type(dobInput, "1990-01-01");
    await userEvent.type(answerInput, "Football");
    await userEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Main St",
        DOB: "1990-01-01",
        answer: "Football",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Register Successfully, please login"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("displays error message on failed registration", async () => {
    // Arrange
    const errorMessage = "Email already exists";
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
        <Register />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.id === "exampleInputName1");
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const phoneInput = inputs.find((input) => input.id === "exampleInputPhone1");
    const addressInput = inputs.find((input) => input.id === "exampleInputaddress1");
    const dobInput = inputs.find((input) => input.type === "date");
    const answerInput = inputs.find((input) => input.id === "exampleInputanswer1");
    const submitButton = screen.getByRole("button", { name: /REGISTER/i });

    // Act
    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(phoneInput, "1234567890");
    await userEvent.type(addressInput, "123 Main St");
    await userEvent.type(dobInput, "1990-01-01");
    await userEvent.type(answerInput, "Football");
    await userEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  test("displays default error message when error message is missing", async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: false,
        message: undefined,
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    toast.error = jest.fn();

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.id === "exampleInputName1");
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const phoneInput = inputs.find((input) => input.id === "exampleInputPhone1");
    const addressInput = inputs.find((input) => input.id === "exampleInputaddress1");
    const dobInput = inputs.find((input) => input.type === "date");
    const answerInput = inputs.find((input) => input.id === "exampleInputanswer1");
    const submitButton = screen.getByRole("button", { name: /REGISTER/i });

    // Act
    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(phoneInput, "1234567890");
    await userEvent.type(addressInput, "123 Main St");
    await userEvent.type(dobInput, "1990-01-01");
    await userEvent.type(answerInput, "Football");
    await userEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration failed");
    });
  });

  test("displays error message on network error", async () => {
    // Arrange
    const mockError = new Error("Network Error");
    axios.post.mockRejectedValue(mockError);
    toast.error = jest.fn();

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const inputs = Array.from(document.querySelectorAll("input"));
    const nameInput = inputs.find((input) => input.id === "exampleInputName1");
    const emailInput = inputs.find((input) => input.type === "email");
    const passwordInput = inputs.find((input) => input.type === "password");
    const phoneInput = inputs.find((input) => input.id === "exampleInputPhone1");
    const addressInput = inputs.find((input) => input.id === "exampleInputaddress1");
    const dobInput = inputs.find((input) => input.type === "date");
    const answerInput = inputs.find((input) => input.id === "exampleInputanswer1");
    const submitButton = screen.getByRole("button", { name: /REGISTER/i });

    // Act
    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(phoneInput, "1234567890");
    await userEvent.type(addressInput, "123 Main St");
    await userEvent.type(dobInput, "1990-01-01");
    await userEvent.type(answerInput, "Football");
    await userEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("handles form field validation (required fields)", () => {
    // Arrange & Act
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Assert
    const inputs = Array.from(document.querySelectorAll("input"));
    inputs.forEach((input) => {
      expect(input).toHaveAttribute("required");
    });
  });

  test("renders form with correct CSS class for styling", () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Assert
    const formContainer = container.querySelector(".form-container");
    expect(formContainer).toBeInTheDocument();
    expect(formContainer).toHaveStyle("minHeight: 90vh");
  });

  test("name input has autoFocus attribute", () => {
    // Arrange & Act
    const { container } = render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Assert
    const nameInputs = container.querySelectorAll(
      "input[id='exampleInputName1']"
    );
    expect(nameInputs.length).toBeGreaterThan(0);
    const nameInput = nameInputs[0];
    const hasAutoFocusLike =
      nameInput.hasAttribute("autoFocus") || document.activeElement === nameInput;
    expect(hasAutoFocusLike || nameInput.autofocus).toBeTruthy();
  });

  test("prevents default form submission behavior", async () => {
    // Arrange
    axios.post.mockResolvedValue({
      data: { success: true, message: "Register Successfully, please login" },
    });
    toast.success = jest.fn();

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const form = screen
      .getByRole("button", { name: /REGISTER/i })
      .closest("form");
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
