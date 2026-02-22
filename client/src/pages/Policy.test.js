import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Policy from './Policy';

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

describe('Policy Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Policy page', () => {
    const { container } = render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );

    expect(container).toBeInTheDocument();
  });

  it('should pass correct title to Layout component', () => {
    const { container } = render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );

    const layout = container.querySelector('[data-testid="layout"]');
    expect(layout).toHaveAttribute('data-title', 'Privacy Policy');
  });

  it('should display the privacy policy image', () => {
    render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );

    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/contactus.jpeg');
  });

  it('should display multiple privacy policy paragraphs', () => {
    render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );

    const paragraphs = screen.getAllByText('add privacy policy');
    expect(paragraphs).toHaveLength(7);
  });

  it('should have correct layout structure with rows and columns', () => {
    const { container } = render(
      <MemoryRouter>
        <Policy />
      </MemoryRouter>
    );

    const row = container.querySelector('.row.contactus');
    expect(row).toBeInTheDocument();

    const imageColumn = container.querySelector('.col-md-6');
    expect(imageColumn).toBeInTheDocument();

    const contentColumn = container.querySelector('.col-md-4');
    expect(contentColumn).toBeInTheDocument();
  });
});
