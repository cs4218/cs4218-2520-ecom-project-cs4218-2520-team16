// Xiao Ao, A0273305L
// Code guided by Github Copilot

/* eslint-disable testing-library/no-node-access */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminMenu from "./AdminMenu.js";

describe("AdminMenu Component Tests", () => {
  it("should render the Admin Panel heading", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("should contain a link to Create Category with correct path", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
    const link = screen.getByText("Create Category");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/admin/create-category");
  });

  it("should contain a link to Create Product with correct path", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
    const link = screen.getByText("Create Product");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/admin/create-product");
  });

  it("should contain a link to Products with correct path", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
    const link = screen.getByText("Products");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/admin/products");
  });

  it("should contain a link to Orders with correct path", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
    const link = screen.getByText("Orders");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/admin/orders");
  });
});