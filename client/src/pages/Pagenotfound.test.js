import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Pagenotfound from './Pagenotfound';

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

// Mock context hooks
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
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

describe('Pagenotfound Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Page Not Found page', () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    expect(container).toBeInTheDocument();
  });

  it('should pass correct title to Layout component', () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    const layout = container.querySelector('[data-testid="layout"]');
    expect(layout).toHaveAttribute('data-title', 'go back- page not found');
  });

  it('should display 404 error code', () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    const title = screen.getByText('404');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('pnf-title');
  });

  it('should display error message', () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    const heading = screen.getByText('Oops ! Page Not Found');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('pnf-heading');
  });

  it('should display Go Back link with correct href', () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    const link = screen.getByText('Go Back');
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('pnf-btn');
    expect(link).toHaveAttribute('href', '/');
  });

  it('should have correct pnf container structure', () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    const pnfContainer = container.querySelector('.pnf');
    expect(pnfContainer).toBeInTheDocument();
  });
});
