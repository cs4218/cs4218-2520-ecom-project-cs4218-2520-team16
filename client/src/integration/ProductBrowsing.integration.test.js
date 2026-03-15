// Xiao Ao A0233705L
// Code guided by Claude
// Test using Top-Down Approach with mocked API responses and component isolation
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

import HomePage from "../pages/HomePage";
import ProductDetails from "../pages/ProductDetails";
import CategoryProduct from "../pages/CategoryProduct";
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
  return () => [
    { _id: "cat-1", name: "Electronics", slug: "electronics" },
    { _id: "cat-2", name: "Books", slug: "books" },
  ];
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };

Object.defineProperty(window, "location", {
  configurable: true,
  value: { reload: jest.fn() },
});

// Shared test data
const mockCategories = [
  { _id: "cat-1", name: "Electronics", slug: "electronics" },
  { _id: "cat-2", name: "Books", slug: "books" },
];

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
    name: "Novel",
    slug: "novel",
    description: "A bestselling fiction novel worth every penny",
    price: 15,
    category: { _id: "cat-2", name: "Books" },
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

function ProductDetailsHarness({ slug = "laptop" }) {
  return (
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[`/product/${slug}`]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function CategoryProductHarness({ slug = "electronics" }) {
  return (
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[`/category/${slug}`]}>
          <Routes>
            <Route path="/category/:slug" element={<CategoryProduct />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function CategoryNavHarness() {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Header />
            <Routes>
              <Route path="/" element={<div>Home</div>} />
              <Route path="/category/:slug" element={<CategoryProduct />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// 1. HOMEPAGE LOADING
describe("HomePage loads products and categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category")
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      if (url === "/api/v1/product/product-count")
        return Promise.resolve({ data: { total: 2 } });
      if (url.startsWith("/api/v1/product/product-list/"))
        return Promise.resolve({ data: { products: mockProducts } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
    axios.post.mockResolvedValue({ data: { products: mockProducts } });
  });

  test("fetches product list on mount", async () => {
    render(<HomeHarness />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  test("fetches product count on mount", async () => {
    render(<HomeHarness />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });
  });

  test("fetches and displays categories in filter panel", async () => {
    render(<HomeHarness />);
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    expect(await screen.findByText("Electronics")).toBeInTheDocument();
    expect(await screen.findByText("Books")).toBeInTheDocument();
  });

  test("displays fetched products with name and price", async () => {
    render(<HomeHarness />);
    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(await screen.findByText("Novel")).toBeInTheDocument();
    expect(await screen.findByText("$1,200.00")).toBeInTheDocument();
    expect(await screen.findByText("$15.00")).toBeInTheDocument();
  });
});

// 2. HOMEPAGE FILTERING
describe("HomePage product filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category")
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      if (url === "/api/v1/product/product-count")
        return Promise.resolve({ data: { total: 2 } });
      if (url.startsWith("/api/v1/product/product-list/"))
        return Promise.resolve({ data: { products: mockProducts } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
    axios.post.mockResolvedValue({ data: { products: [mockProducts[0]] } });
  });

  test("selecting a single category POSTs correct filter payload", async () => {
    render(<HomeHarness />);
    await screen.findByText("Electronics");

    const [electronicsCheckbox] = screen.getAllByRole("checkbox");
    fireEvent.click(electronicsCheckbox);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["cat-1"]),
        })
      );
    });
  });

  test("selecting multiple categories includes all IDs in POST payload", async () => {
    render(<HomeHarness />);
    await screen.findByText("Electronics");

    const [electronicsCheckbox, booksCheckbox] =
      screen.getAllByRole("checkbox");
    fireEvent.click(electronicsCheckbox);
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

    fireEvent.click(booksCheckbox);
    await waitFor(() => {
      const lastCall =
        axios.post.mock.calls[axios.post.mock.calls.length - 1];
      expect(lastCall[1].checked).toEqual(
        expect.arrayContaining(["cat-1", "cat-2"])
      );
    });
  });

  test("selecting a price range POSTs correct filter payload", async () => {
    render(<HomeHarness />);
    await screen.findByText("Electronics");

    fireEvent.click(screen.getByText("$0 to 19"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({ radio: [0, 19] })
      );
    });
  });

  test("selecting category + price range combines both in POST payload", async () => {
    render(<HomeHarness />);
    await screen.findByText("Electronics");

    const [electronicsCheckbox] = screen.getAllByRole("checkbox");
    fireEvent.click(electronicsCheckbox);
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("$0 to 19"));

    await waitFor(() =>
      expect(axios.post.mock.calls.length).toBeGreaterThanOrEqual(2)
    );
    const lastCall = axios.post.mock.calls[axios.post.mock.calls.length - 1];
    expect(lastCall[1].checked).toContain("cat-1");
    expect(lastCall[1].radio).toEqual([0, 19]);
  });

  test("filter results displayed match API response", async () => {
    axios.post.mockResolvedValue({ data: { products: [mockProducts[0]] } });

    render(<HomeHarness />);
    await screen.findByText("Electronics");

    const [electronicsCheckbox] = screen.getAllByRole("checkbox");
    fireEvent.click(electronicsCheckbox);

    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Novel")).not.toBeInTheDocument()
    );
  });

  test("RESET FILTERS button calls window.location.reload", async () => {
    render(<HomeHarness />);
    await screen.findByText("RESET FILTERS");

    fireEvent.click(screen.getByText("RESET FILTERS"));

    expect(window.location.reload).toHaveBeenCalled();
  });
});

// 3. PRODUCT DETAILS PAGE
describe("ProductDetails page", () => {
  const mockProduct = {
    _id: "p1",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop",
    price: 1200,
    category: { _id: "cat-1", name: "Electronics" },
  };

  const mockRelated = [
    {
      _id: "p3",
      name: "Phone",
      slug: "phone",
      description: "A smartphone for everyday use",
      price: 800,
    },
    {
      _id: "p4",
      name: "Tablet",
      slug: "tablet",
      description: "A tablet for reading and browsing",
      price: 600,
    },
    {
      _id: "p5",
      name: "Monitor",
      slug: "monitor",
      description: "A widescreen display monitor",
      price: 400,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/laptop")
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.startsWith("/api/v1/product/related-product/"))
        return Promise.resolve({ data: { products: mockRelated } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
  });

  test("fetches product by slug on mount", async () => {
    render(<ProductDetailsHarness />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/laptop"
      );
    });
  });

  test("displays product name, description, price, and category", async () => {
    render(<ProductDetailsHarness />);
    expect(await screen.findByText(/Laptop/)).toBeInTheDocument();
    expect(await screen.findByText(/A powerful laptop/)).toBeInTheDocument();
    expect(await screen.findByText(/\$1,200\.00/)).toBeInTheDocument();
    expect(await screen.findByText(/Electronics/)).toBeInTheDocument();
  });

  test("product photo src uses product ID", async () => {
    render(<ProductDetailsHarness />);
    await waitFor(() => {
      const [mainImg] = screen.getAllByRole("img");
      expect(mainImg).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/p1"
      );
    });
  });

  test("fetches related products using product ID and category ID", async () => {
    render(<ProductDetailsHarness />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/p1/cat-1"
      );
    });
  });

  test("displays related products returned by API", async () => {
    render(<ProductDetailsHarness />);
    expect(await screen.findByText("Phone")).toBeInTheDocument();
    expect(await screen.findByText("Tablet")).toBeInTheDocument();
    expect(await screen.findByText("Monitor")).toBeInTheDocument();
  });

  test("shows 'No Similar Products found' when none returned", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/laptop")
        return Promise.resolve({ data: { product: mockProduct } });
      if (url.startsWith("/api/v1/product/related-product/"))
        return Promise.resolve({ data: { products: [] } });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });

    render(<ProductDetailsHarness />);
    await waitFor(() => {
      expect(
        screen.getByText("No Similar Products found")
      ).toBeInTheDocument();
    });
  });

  test("displays all related products returned by API (max 3 enforced by backend)", async () => {
    render(<ProductDetailsHarness />);
    await waitFor(() => {
      const moreDetailsButtons = screen.getAllByRole("button", {
        name: /More Details/i,
      });
      expect(moreDetailsButtons).toHaveLength(3);
    });
  });
});

// 4. CATEGORY NAVIGATION
describe("Category navigation", () => {
  const mockCategoryProducts = [
    {
      _id: "p1",
      name: "Laptop",
      slug: "laptop",
      description: "A powerful laptop for all your needs",
      price: 1200,
    },
    {
      _id: "p2",
      name: "Phone",
      slug: "phone",
      description: "A smartphone for daily use and more",
      price: 800,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/product-category/electronics")
        return Promise.resolve({
          data: {
            category: {
              _id: "cat-1",
              name: "Electronics",
              slug: "electronics",
            },
            products: mockCategoryProducts,
          },
        });
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
  });

  test("Header categories dropdown is populated from useCategory hook", () => {
    render(<CategoryNavHarness />);
    expect(
      screen.getByRole("link", { name: "Electronics" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Books" })).toBeInTheDocument();
  });

  test("clicking a category link in Header navigates to /category/{slug}", async () => {
    render(<CategoryNavHarness />);

    fireEvent.click(screen.getByRole("link", { name: "Electronics" }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/electronics"
      );
    });
  });

  test("CategoryProduct fetches products for the given slug", async () => {
    render(<CategoryProductHarness />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/electronics"
      );
    });
  });

  test("CategoryProduct displays category name", async () => {
    render(<CategoryProductHarness />);
    await waitFor(() => {
      expect(screen.getByText(/Category - Electronics/)).toBeInTheDocument();
    });
  });

  test("CategoryProduct shows correct product count", async () => {
    render(<CategoryProductHarness />);
    await waitFor(() => {
      expect(screen.getByText(/2 result found/)).toBeInTheDocument();
    });
  });

  test("CategoryProduct displays only products in that category", async () => {
    render(<CategoryProductHarness />);
    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(await screen.findByText("Phone")).toBeInTheDocument();
  });
});
