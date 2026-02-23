/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../hooks/useCategory");

jest.mock("../components/Layout", () => ({ title, children }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ),
);

describe("Categories", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders a link for each category returned by the hook", () => {
    // Arrange
    useCategory.mockReturnValue([
      { _id: "1", name: "Books", slug: "books" },
      { _id: "2", name: "Electronics", slug: "electronics" },
    ]);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "All Categories"
    );

    const booksLink = screen.getByRole("link", { name: "Books" });
    const electronicsLink = screen.getByRole("link", { name: "Electronics" });

    expect(booksLink).toHaveAttribute("href", "/category/books");
    expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
  });

  test("renders no category links when hook returns empty array", () => {
    // Arrange
    useCategory.mockReturnValue([]);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});