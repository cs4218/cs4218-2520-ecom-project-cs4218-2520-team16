import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Contact from './Contact';

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

// Mock react-icons
jest.mock('react-icons/bi', () => ({
  BiMailSend: () => <span data-testid="mail-icon">Mail</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">Phone</span>,
  BiSupport: () => <span data-testid="support-icon">Support</span>,
}));

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

describe('Contact Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Contact page', () => {
    const { container } = render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    expect(container).toBeInTheDocument();
  });

  it('should display CONTACT US heading', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    expect(screen.getByText('CONTACT US')).toBeInTheDocument();
  });

  it('should display email contact information', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/www.help@ecommerceapp.com/i)).toBeInTheDocument();
  });

  it('should display phone contact information', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();
  });

  it('should display toll-free number', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/1800-0000-0000/i)).toBeInTheDocument();
  });
});
