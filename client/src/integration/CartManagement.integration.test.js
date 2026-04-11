// Xiao Ao A0233705L
// Code guided by Claude
// Test using Top-Down Approach with mocked API responses and component isolation
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

import HomePage from "../pages/HomePage";
import CartPage from "../pages/CartPage";
import Header from "../components/Header";
import { CartProvider } from "../context/cart";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";

jest.mock("axios");
jest.mock("react-hot-toast");

// axios is fully mocked so axios.defaults is undefined — initialise it so
// auth.js can set axios.defaults.headers.common["Authorization"] without crashing
beforeEach(() => {
  axios.defaults = { headers: { common: {} } };
});

jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div>{children}</div>;
  };
});

jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => <span>Reload</span>,
  AiFillWarning: () => <span>Warning</span>,
}));

jest.mock("../components/Prices", () => ({
  Prices: [
    { _id: 0, name: "$0 to 19", array: [0, 19] },
    { _id: 1, name: "$20 to 39", array: [20, 39] },
  ],
}));

jest.mock("antd", () => {
  const Checkbox = ({ children, onChange }) => (
    <label>
      <input type="checkbox" onChange={onChange} />
      {children}
    </label>
  );

  const Radio = ({ children, value }) => (
    <label data-value={JSON.stringify(value)}>
      <input type="radio" data-value={JSON.stringify(value)} readOnly />
      {children}
    </label>
  );

  Radio.Group = ({ children, onChange }) => (
    <div
      data-testid="radio-group"
      onClick={(e) => {
        const dataValue = e.target.dataset.value;
        if (dataValue) {
          onChange({ target: { value: JSON.parse(dataValue) } });
        }
      }}
    >
      {children}
    </div>
  );

  const Badge = ({ count, children }) => (
    <div>
      <span data-testid="cart-count">{count}</span>
      {children}
    </div>
  );

  return { Checkbox, Radio, Badge };
});

jest.mock("../hooks/useCategory", () => {
  return () => [{ _id: "cat-1", name: "Electronics", slug: "electronics" }];
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

window.matchMedia =
  window.matchMedia ||
  function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };

// Shared test data 
const mockProducts = [
  {
    _id: "p1",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop for work and gaming tasks",
    price: 1200,
    category: { _id: "cat-1", name: "Electronics" },
  },
  {
    _id: "p2",
    name: "Phone",
    slug: "phone",
    description: "A smartphone for everyday use and more",
    price: 800,
    category: { _id: "cat-1", name: "Electronics" },
  },
];

// Harnesses 
function HomeHarness() {
  return (
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function HomeWithHeaderHarness() {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function CartHarness() {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/cart"]}>
            <Routes>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/dashboard/user/orders" element={<div>Orders</div>} />
              <Route path="/login" element={<div>Login</div>} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function setupHomeAxios() {
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category")
      return Promise.resolve({
        data: { success: true, category: [{ _id: "cat-1", name: "Electronics", slug: "electronics" }] },
      });
    if (url === "/api/v1/product/product-count")
      return Promise.resolve({ data: { total: 2 } });
    if (url.startsWith("/api/v1/product/product-list/"))
      return Promise.resolve({ data: { products: mockProducts } });
    if (url === "/api/v1/product/braintree/token")
      return Promise.resolve({ data: { clientToken: "" } });
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
  axios.post.mockResolvedValue({ data: { products: mockProducts } });
}

// 1. ADDING ITEMS TO CART FROM HOMEPAGE
describe("Add to cart from HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupHomeAxios();
  });

  test("adding a product saves it to localStorage cart", async () => {
    render(<HomeHarness />);
    await screen.findByText("Laptop");

    fireEvent.click(screen.getAllByText("ADD TO CART")[0]);

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("cart"));
      expect(cart).toHaveLength(1);
    });
    expect(JSON.parse(localStorage.getItem("cart"))[0]._id).toBe("p1");
  });

  test("adding multiple products preserves all items in cart", async () => {
    render(<HomeHarness />);
    await screen.findByText("Laptop");

    const addButtons = screen.getAllByText("ADD TO CART");
    fireEvent.click(addButtons[0]); // Laptop
    fireEvent.click(addButtons[1]); // Phone

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("cart"));
      expect(cart).toHaveLength(2);
    });
    const cart = JSON.parse(localStorage.getItem("cart"));
    expect(cart.map((i) => i._id)).toEqual(
      expect.arrayContaining(["p1", "p2"])
    );
  });

  test("adding the same product twice creates duplicate entries", async () => {
    render(<HomeHarness />);
    await screen.findByText("Laptop");

    const addButtons = screen.getAllByText("ADD TO CART");
    fireEvent.click(addButtons[0]);
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("cart"));
      expect(cart).toHaveLength(2);
    });
    const cart = JSON.parse(localStorage.getItem("cart"));
    expect(cart.every((i) => i._id === "p1")).toBe(true);
  });

  test("cart badge in Header updates immediately when item is added", async () => {
    render(<HomeWithHeaderHarness />);
    await screen.findByText("Laptop");

    expect(screen.getByTestId("cart-count").textContent).toBe("0");

    fireEvent.click(screen.getAllByText("ADD TO CART")[0]);

    await waitFor(() => {
      expect(screen.getByTestId("cart-count").textContent).toBe("1");
    });
  });
});

// 2. CARTPAGE DISPLAY
describe("CartPage display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("cart", JSON.stringify(mockProducts));
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/braintree/token")
        return Promise.resolve({ data: { clientToken: "" } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
  });

  test("shows correct item count message", async () => {
    render(<CartHarness />);
    await waitFor(() => {
      expect(
        screen.getByText(/You Have 2 items in your cart/)
      ).toBeInTheDocument();
    });
  });

  test("displays all cart items with name, description, and price", async () => {
    render(<CartHarness />);
    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(await screen.findByText("Phone")).toBeInTheDocument();
    expect(await screen.findByText(/Price : 1200/)).toBeInTheDocument();
    expect(await screen.findByText(/Price : 800/)).toBeInTheDocument();
  });

  test("product photo src uses product ID for each cart item", async () => {
    render(<CartHarness />);
    const imgs = await screen.findAllByRole("img");
    expect(imgs[0]).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
    expect(imgs[1]).toHaveAttribute("src", "/api/v1/product/product-photo/p2");
  });

  test("calculates and displays correct total price", async () => {
    render(<CartHarness />);
    await waitFor(() => {
      expect(screen.getByText(/Total : \$2,000\.00/)).toBeInTheDocument();
    });
  });
});

// 3. CARTPAGE REMOVE OPERATIONS
describe("CartPage remove operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("cart", JSON.stringify(mockProducts));
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/braintree/token")
        return Promise.resolve({ data: { clientToken: "" } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
  });

  test("removing an item updates localStorage cart", async () => {
    render(<CartHarness />);
    await screen.findByText("Laptop");

    fireEvent.click(screen.getAllByText("Remove")[0]); // remove Laptop

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("cart"));
      expect(cart).toHaveLength(1);
    });
    expect(JSON.parse(localStorage.getItem("cart"))[0]._id).toBe("p2");
  });

  test("Remove button removes only the specific item, others remain", async () => {
    render(<CartHarness />);
    await screen.findByText("Laptop");

    fireEvent.click(screen.getAllByText("Remove")[0]); // remove Laptop only

    await waitFor(() =>
      expect(screen.queryByText("Laptop")).not.toBeInTheDocument()
    );
    expect(await screen.findByText("Phone")).toBeInTheDocument();
  });

  test("total price updates after item is removed", async () => {
    render(<CartHarness />);
    await screen.findByText(/Total : \$2,000\.00/);

    fireEvent.click(screen.getAllByText("Remove")[0]); // remove Laptop ($1,200)

    await waitFor(() => {
      expect(screen.getByText(/Total : \$800\.00/)).toBeInTheDocument();
    });
  });
});

// 4. CART PERSISTENCE
describe("Cart persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockResolvedValue({ data: { clientToken: "" } });
  });

  test("cart items are restored from localStorage on mount", async () => {
    localStorage.setItem("cart", JSON.stringify([mockProducts[0]]));
    render(<CartHarness />);
    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });
});

// 5. CART CLEARED AFTER PAYMENT
describe("Cart cleared after payment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { _id: "u1", name: "Alice", role: 0, address: "123 NUS" },
        token: "token-1",
      })
    );
    localStorage.setItem("cart", JSON.stringify([mockProducts[0]]));
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/braintree/token")
        return Promise.resolve({ data: { clientToken: "fake-token" } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  test("cart is removed from localStorage after successful payment", async () => {
    render(<CartHarness />);

    await screen.findByTestId("dropin");
    const payButton = screen.getByText("Make Payment");
    await waitFor(() => expect(payButton).not.toBeDisabled());

    fireEvent.click(payButton);

    await waitFor(() => {
      expect(localStorage.getItem("cart")).toBeNull();
    });
  });

  test("cart state is emptied and user navigates to orders after payment", async () => {
    render(<CartHarness />);

    await screen.findByTestId("dropin");
    const payButton = screen.getByText("Make Payment");
    await waitFor(() => expect(payButton).not.toBeDisabled());

    fireEvent.click(payButton);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders")
    );
    expect(await screen.findByText(/Your Cart Is Empty/)).toBeInTheDocument();
  });
});
