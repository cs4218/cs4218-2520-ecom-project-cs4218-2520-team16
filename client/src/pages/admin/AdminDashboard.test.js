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
    // Mocking auth state with user details
    useAuth.mockReturnValue([{
      user: {
        name: "Xiao Ao",
        email: "xiao@nus.edu.sg",
        phone: "91234567"
      }
    }]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Verify the display of data from the card
    expect(screen.getByText("Admin Name : Xiao Ao")).toBeInTheDocument();
    expect(screen.getByText("Admin Email : xiao@nus.edu.sg")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact : 91234567")).toBeInTheDocument();
  });

  it("should render the Layout and AdminMenu components", () => {
    useAuth.mockReturnValue([{ user: null }]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Verify sub-components are present in the layout
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  it("should handle cases where auth or user is undefined (Optional Chaining test)", () => {
    // Testing the auth?.user?.name logic
    useAuth.mockReturnValue([{}]); 

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });
});