// Xiao Ao, A0273305L
// Code guided by Github Copilot

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminDashboard from "./AdminDashboard.js";
import { useAuth } from "../../context/auth.js";

// Mocking dependencies to isolate AdminDashboard logic
jest.mock("../../context/auth.js");
jest.mock("../../components/AdminMenu.js", () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock("./../../components/Layout.js", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("AdminDashboard Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render admin information from the auth context", () => {
    // Arrange
    useAuth.mockReturnValue([{
      user: {
        name: "Xiao Ao",
        email: "xiao@nus.edu.sg",
        phone: "91234567"
      }
    }]);

    // Act
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("Admin Name : Xiao Ao")).toBeInTheDocument();
    expect(screen.getByText("Admin Email : xiao@nus.edu.sg")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact : 91234567")).toBeInTheDocument();
  });

  it("should render the Layout and AdminMenu components", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null }]);

    // Act
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  it("should handle cases where auth or user is undefined (Optional Chaining test)", () => {
    // Arrange
    useAuth.mockReturnValue([{}]); 

    // Act
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });
});