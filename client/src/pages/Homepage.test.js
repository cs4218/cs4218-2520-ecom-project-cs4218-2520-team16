import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import HomePage from './Homepage';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock Prices component
jest.mock('../components/Prices', () => ({
  Prices: [
    { _id: 0, name: '$0 to $19', array: [0, 19] },
    { _id: 1, name: '$20 to $39', array: [20, 39] },
  ],
}));

// Mock antd components
jest.mock('antd', () => ({
  Checkbox: ({ children, onChange }) => (
    <label>
      <input type="checkbox" onChange={onChange} data-testid="category-checkbox" />
      {children}
    </label>
  ),
  Radio: ({ children, value }) => (
    <label>
      <input type="radio" value={value} data-testid="price-radio" />
      {children}
    </label>
  ),
}));

// Add Radio.Group mock
const Radio = require('antd').Radio;
Radio.Group = ({ children, onChange }) => (
  <div onChange={onChange} data-testid="radio-group">
    {children}
  </div>
);

// Mock react-icons
jest.mock('react-icons/ai', () => ({
  AiOutlineReload: () => <span data-testid="reload-icon">Reload</span>,
}));

// Mock context hooks
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

const mockSetCart = jest.fn();
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], mockSetCart]),
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

describe('HomePage Component', () => {
  const mockCategories = {
    success: true,
    category: [
      { _id: '1', name: 'Electronics' },
      { _id: '2', name: 'Clothing' },
    ],
  };

  const mockProducts = {
    products: [
      {
        _id: 'p1',
        name: 'Product 1',
        slug: 'product-1',
        description: 'This is a test product description that is longer than 60 characters',
        price: 100,
      },
      {
        _id: 'p2',
        name: 'Product 2',
        slug: 'product-2',
        description: 'Another test product description',
        price: 200,
      },
    ],
  };

  const mockProductCount = {
    total: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === '/api/v1/category/get-category') {
        return Promise.resolve({ data: mockCategories });
      }
      if (url === '/api/v1/product/product-count') {
        return Promise.resolve({ data: mockProductCount });
      }
      if (url.includes('/api/v1/product/product-list/')) {
        return Promise.resolve({ data: mockProducts });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    axios.post.mockResolvedValue({ data: mockProducts });
    toast.success = jest.fn();
  });

  it('should render the HomePage', async () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('should display banner image', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const banner = screen.getByAltText('bannerimage');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute('src', '/images/Virtual.png');
    });
  });

  it('should fetch and display categories on mount', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
    });
  });

  it('should fetch and display products on mount', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/1');
      expect(screen.getByText('All Products')).toBeInTheDocument();
    });
  });

  it('should display Filter By Price heading', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filter By Price')).toBeInTheDocument();
    });
  });

  it('should display RESET FILTERS button', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('RESET FILTERS')).toBeInTheDocument();
    });
  });

  it('should fetch product count on mount', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-count');
    });
  });

  it('should pass correct title to Layout component', async () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const layout = container.querySelector('[data-testid="layout"]');
      expect(layout).toHaveAttribute('data-title', 'ALL Products - Best offers ');
    });
  });
});
