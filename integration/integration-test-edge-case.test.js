// Wang Zihan A0266073A
// With suggestions from ChatGPT 5.4

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import CartPage from "../client/src/pages/CartPage";
import Login from "../client/src/pages/Auth/Login";
import Search from "../client/src/pages/Search";
import SearchInput from "../client/src/components/Form/SearchInput";
import { AuthProvider } from "../client/src/context/auth";
import { CartProvider } from "../client/src/context/cart";
import { SearchProvider } from "../client/src/context/search";

jest.mock("axios");
jest.mock(
  "react-hot-toast",
  () => ({
    __esModule: true,
    default: {
      success: jest.fn(),
      error: jest.fn(),
    },
  }),
  { virtual: true }
);

jest.mock("../client/src/components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock(
  "braintree-web-drop-in-react",
  () => {
    const React = require("react");

    return function MockDropIn({ onInstance }) {
      React.useEffect(() => {
        onInstance({
          requestPaymentMethod: jest
            .fn()
            .mockResolvedValue({ nonce: "fake-nonce" }),
        });
      }, []);

      return <div data-testid="dropin">Mock DropIn</div>;
    };
  },
  { virtual: true }
);

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function CartAndLoginHarness() {
  return (
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/cart"]}>
          <LocationDisplay />
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function SearchFailureHarness() {
  return (
    <CartProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>
          <LocationDisplay />
          <Routes>
            <Route path="/" element={<SearchInput />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    </CartProvider>
  );
}

function PaymentFailureHarness() {
  return (
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/cart"]}>
          <LocationDisplay />
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/dashboard/user/orders" element={<div>Orders</div>} />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function LoginRedirectHarness({
  initialEntry,
  redirectRoute = "/dashboard/user",
  redirectLabel = "User Dashboard",
}) {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationDisplay />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path={redirectRoute} element={<div>{redirectLabel}</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("Integration tests gaps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults = { headers: { common: {} } };
  });

  test("guest checkout login returns the user to cart with cart contents intact", async () => {
    // Arrange
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          _id: "p1",
          name: "Travel Backpack",
          slug: "travel-backpack",
          description: "Carry-on ready travel backpack",
          price: 149,
        },
      ])
    );

    axios.get.mockResolvedValue({ data: { clientToken: "" } });
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "login successfully",
        user: {
          _id: "u1",
          name: "Alice",
          email: "alice@example.com",
          phone: "99999999",
          address: "123 Test Street",
          role: 0,
        },
        token: "token-123",
      },
    });

    // Act
    render(<CartAndLoginHarness />);
    await userEvent.click(
      await screen.findByRole("button", { name: /plase login to checkout/i })
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter your email/i),
      "alice@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter your password/i),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toContain("/cart");
    });

    expect(screen.getByText(/Hello Alice/i)).not.toBeNull();
    expect(
      screen.getByText(/You Have 1 items in your cart/i)
    ).not.toBeNull();
    expect(screen.getByText("Travel Backpack")).not.toBeNull();
  });

  test("login redirects to the route stored in location.state.from after a successful login", async () => {
    // Arrange
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "login successfully",
        user: {
          _id: "u2",
          name: "Bob",
          email: "bob@example.com",
          phone: "88888888",
          address: "456 Redirect Lane",
          role: 0,
        },
        token: "token-redirect",
      },
    });

    // Act
    render(
      <LoginRedirectHarness
        initialEntry={{
          pathname: "/login",
          state: { from: "/dashboard/user" },
        }}
      />
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter your email/i),
      "bob@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter your password/i),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toContain(
        "/dashboard/user"
      );
    });

    expect(screen.getByText("User Dashboard")).not.toBeNull();
    expect(toast.success).toHaveBeenCalled();
  });

  test("login falls back to the home page when no redirect state is provided", async () => {
    // Arrange
    axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "login successfully",
        user: {
          _id: "u3",
          name: "Carol",
          email: "carol@example.com",
          phone: "77777777",
          address: "789 Home Street",
          role: 0,
        },
        token: "token-home",
      },
    });

    // Act
    render(<LoginRedirectHarness initialEntry="/login" />);
    await userEvent.type(
      screen.getByPlaceholderText(/enter your email/i),
      "carol@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/enter your password/i),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/");
    });

    expect(screen.getByText("Home Page")).not.toBeNull();
    expect(toast.success).toHaveBeenCalled();
  });

  test("search API failure still navigates to search page and shows the empty state", async () => {
    // Arrange
    axios.get.mockRejectedValue(new Error("search failed"));

    // Act
    render(<SearchFailureHarness />);
    await userEvent.type(screen.getByRole("searchbox"), "tablet");
    await userEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/tablet");
      expect(screen.getByTestId("location").textContent).toContain("/search");
    });

    expect(screen.getByText("Search Resuts")).not.toBeNull();
    expect(screen.getByText("No Products Found")).not.toBeNull();
  });

  test("failed payment keeps the cart and does not navigate away from cart", async () => {
    // Arrange
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          _id: "u1",
          name: "Alice",
          role: 0,
          address: "123 Test Street",
        },
        token: "token-123",
      })
    );
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          _id: "p1",
          name: "Travel Backpack",
          slug: "travel-backpack",
          description: "Carry-on ready travel backpack",
          price: 149,
        },
      ])
    );

    axios.get.mockResolvedValue({ data: { clientToken: "client-token" } });
    axios.post.mockRejectedValue(new Error("payment failed"));

    // Act
    render(<PaymentFailureHarness />);
    const payButton = await screen.findByRole("button", {
      name: /make payment/i,
    });

    await waitFor(() => {
      expect(payButton.disabled).toBe(false);
    });

    await userEvent.click(payButton);

    // Assert
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        {
          nonce: "fake-nonce",
          cart: [
            {
              _id: "p1",
              name: "Travel Backpack",
              slug: "travel-backpack",
              description: "Carry-on ready travel backpack",
              price: 149,
            },
          ],
        }
      );
    });

    expect(screen.getByTestId("location").textContent).toContain("/cart");
    expect(localStorage.getItem("cart")).not.toBeNull();
    expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(1);
    expect(screen.getByText("Travel Backpack")).not.toBeNull();
    expect(toast.success).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /make payment/i }).disabled
      ).toBe(false);
    });
  });
});
