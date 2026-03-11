// Wen Han Tang A0340008W
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import Header from "../components/Header";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider, useSearch } from "../context/search";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../hooks/useCategory", () => {
  return () => [
    { _id: "c1", name: "Electronics", slug: "electronics" },
    { _id: "c2", name: "Books", slug: "books" },
  ];
});

jest.mock("antd", () => ({
  Badge: ({ count, children }) => (
    <div>
      <span data-testid="cart-count">{count}</span>
      {children}
    </div>
  ),
}));

function SearchResultsView() {
  const [values] = useSearch();
  return (
    <div>
      <h1>Search Page</h1>
      <p data-testid="result-count">{values.results.length}</p>
      {values.results.map((item) => (
        <p key={item._id}>{item.name}</p>
      ))}
    </div>
  );
}

function IntegrationHarness({ initialPath = "/" }) {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Header />
            <Routes>
              <Route path="/" element={<div>Home Screen</div>} />
              <Route path="/login" element={<div>Login Screen</div>} />
              <Route path="/search" element={<SearchResultsView />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

describe("Header/Auth/Cart/Search integration flows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults = { headers: { common: {} } };
  });

  test("restores auth and cart from localStorage and supports logout", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { _id: "u1", name: "Alice", role: 0 },
        token: "token-1",
      })
    );
    localStorage.setItem(
      "cart",
      JSON.stringify([
        { _id: "p1", name: "Phone", price: 999 },
        { _id: "p2", name: "Case", price: 29 },
      ])
    );

    toast.success = jest.fn();

    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

    render(<IntegrationHarness />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByTestId("cart-count").textContent).toBe("2");
    });

    const logoutLink = screen.getByText("Logout");
    fireEvent.click(logoutLink);

    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalledWith("auth");
      expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
    });

    removeItemSpy.mockRestore();
  });

  test("search input updates search context and navigates to search results", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/search/iphone") {
        return Promise.resolve({
          data: [
            { _id: "p1", name: "iPhone 15" },
            { _id: "p2", name: "iPhone Case" },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<IntegrationHarness />);

    const searchInput = screen.getByPlaceholderText("Search");
    const searchButton = screen.getByRole("button", { name: "Search" });

    fireEvent.change(searchInput, { target: { value: "iphone" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/iphone");
      expect(screen.getByText("Search Page")).toBeInTheDocument();
      expect(screen.getByTestId("result-count").textContent).toBe("2");
      expect(screen.getByText("iPhone 15")).toBeInTheDocument();
      expect(screen.getByText("iPhone Case")).toBeInTheDocument();
    });
  });
});
