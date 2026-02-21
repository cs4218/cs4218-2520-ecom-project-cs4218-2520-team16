// Written by Roger Yao with the help of Copilot

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "./components/Routes/Private";
import UserMenu from "./components/UserMenu";
import Dashboard from "./pages/user/Dashboard";
import { useAuth } from "./context/auth";

jest.mock("axios");
jest.mock("./context/auth");

jest.mock("mongoose", () => {
  const Schema = jest.fn(function Schema(definition, options) {
    this.obj = definition;
    this.options = options;
  });
  const model = jest.fn((name, schema) => ({ name, schema }));
  const set = jest.fn();
  const mongooseDefault = { Schema, model, set };

  return {
    __esModule: true,
    default: mongooseDefault,
    Schema,
    model,
    set,
  };
});

jest.mock("./components/Spinner", () => {
  return function MockSpinner({ path }) {
    return <div data-testid="spinner" data-path={path}>Loading</div>;
  };
});

jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    Outlet: () => <div data-testid="outlet">Outlet</div>,
  };
});

jest.mock("./components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});


describe("General1 - PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Spinner when auth token is missing", async () => {
    // Arrange
    useAuth.mockReturnValue([{}, jest.fn()]);

    // Act
    render(<PrivateRoute />);

    // Assert
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  test("renders Outlet when auth check succeeds", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    // Act
    await act(async () => {
      render(<PrivateRoute />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
  });

  test("keeps Spinner when auth check fails", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    // Act
    await act(async () => {
      render(<PrivateRoute />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });
});

describe("General1 - UserMenu", () => {
  test("renders dashboard links", () => {
    // Arrange

    // Act
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/dashboard/user/orders"
    );
  });
});

describe("General1 - Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders layout title and user info", () => {
    // Arrange
    useAuth.mockReturnValue([
      {
        user: {
          name: "Alice",
          email: "alice@example.com",
          address: "Singapore",
        },
      },
    ]);

    // Act
    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Dashboard - Ecommerce App"
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Singapore")).toBeInTheDocument();
    expect(container.querySelector(".container-flui")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  test("handles missing auth user safely", () => {
    // Arrange
    useAuth.mockReturnValue([{}, jest.fn()]);

    // Act
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });
});

describe("General1 - userModel", () => {
  test("defines schema fields and defaults correctly", () => {
    // Arrange
    const mongoose = jest.requireMock("mongoose");

    // Act
    return import("../../models/userModel.js").then(() => {
      const schemaInstance = mongoose.Schema.mock.instances[0];

      // Assert
      expect(mongoose.model).toHaveBeenCalledWith("users", schemaInstance);
      expect(schemaInstance.obj.name).toEqual(
        expect.objectContaining({ type: String, required: true, trim: true })
      );
      expect(schemaInstance.obj.email).toEqual(
        expect.objectContaining({ type: String, required: true, unique: true })
      );
      expect(schemaInstance.obj.password).toEqual(
        expect.objectContaining({ type: String, required: true })
      );
      expect(schemaInstance.obj.phone).toEqual(
        expect.objectContaining({ type: String, required: true })
      );
      expect(schemaInstance.obj.address).toEqual(
        expect.objectContaining({ required: true })
      );
      expect(schemaInstance.obj.answer).toEqual(
        expect.objectContaining({ type: String, required: true })
      );
      expect(schemaInstance.obj.role).toEqual(
        expect.objectContaining({ type: Number, default: 0 })
      );
      expect(schemaInstance.options).toEqual(
        expect.objectContaining({ timestamps: true })
      );
    });
  });

  test("exports a model object", () => {
    // Arrange
    const mongoose = jest.requireMock("mongoose");

    // Act
    return import("../../models/userModel.js").then((module) => {
      const exportedModel = module.default?.default ?? module.default ?? module;

      // Assert
      expect(mongoose.model).toHaveBeenCalled();
      expect(exportedModel).toEqual(expect.objectContaining({ name: "users" }));
    });
  });
});
