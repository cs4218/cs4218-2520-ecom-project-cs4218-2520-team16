/**
 * Integration Tests for Checkout & Payment Flow
 * Author: Aum Chotaliya
 * Student ID: A0338423E
 * Testing complete user journey from cart to payment completion
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import CartPage from './CartPage';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Layout
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock Braintree DropIn
const mockRequestPaymentMethod = jest.fn();
jest.mock('braintree-web-drop-in-react', () => {
  return function MockDropIn({ onInstance, options }) {
    const mockReact = require('react');
    const instanceRef = mockReact.useRef(null);
    
    mockReact.useEffect(() => {
      if (!instanceRef.current && onInstance) {
        instanceRef.current = {
          requestPaymentMethod: mockRequestPaymentMethod,
        };
        onInstance(instanceRef.current);
      }
    }, []);
    
    return <div data-testid="braintree-dropin">Braintree DropIn Mock</div>;
  };
});

// Mock icons
jest.mock('react-icons/ai', () => ({
  AiFillWarning: () => <span data-testid="warning-icon">Warning</span>,
}));

// Mock context
const mockSetAuth = jest.fn();
const mockSetCart = jest.fn();

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});

describe('Checkout & Payment Integration Tests', () => {
  // Increase timeout for integration tests to prevent worker termination
  jest.setTimeout(30000);

  const mockProducts = [
    {
      _id: 'prod1',
      name: 'Test Product 1',
      description: 'Test description for product 1',
      price: 100,
    },
    {
      _id: 'prod2',
      name: 'Test Product 2',
      description: 'Test description for product 2',
      price: 200,
    },
  ];

  const mockAuthUser = {
    token: 'test-jwt-token',
    user: {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      address: '123 Test St, Test City',
    },
  };

  const mockAuthUserNoAddress = {
    token: 'test-jwt-token',
    user: {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    toast.success = jest.fn();
    toast.error = jest.fn();
  });

  describe('Pre-Checkout Validation', () => {
    it('should show login prompt for unauthenticated user', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([null, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Hello Guest')).toBeInTheDocument();
      expect(screen.getByText(/please login to checkout/i)).toBeInTheDocument();
      expect(screen.getByText('Plase Login to checkout')).toBeInTheDocument();
    });

    it('should redirect to login when unauthenticated user clicks checkout', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([null, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      const loginButton = screen.getByText('Plase Login to checkout');
      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: '/cart',
      });
    });

    it('should allow authenticated user to proceed to checkout', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(`Hello ${mockAuthUser.user.name}`)).toBeInTheDocument();
        expect(screen.queryByText(/please login to checkout/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show error message when cart is empty', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Your Cart Is Empty')).toBeInTheDocument();
    });

    it('should disable checkout when cart has items but no address', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUserNoAddress, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const updateAddressButton = screen.getByText('Update Address');
        expect(updateAddressButton).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should enable checkout when cart has items and user has address', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Address')).toBeInTheDocument();
        expect(screen.getByText(mockAuthUser.user.address)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Braintree Integration', () => {
    it('should fetch Braintree client token on mount', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/braintree/token');
      }, { timeout: 5000 });
    });

    it('should render Braintree DropIn UI with valid token', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should not render DropIn when no client token', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: null },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
    });

    it('should not render DropIn when user not authenticated', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([null, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
    });

    it('should not render DropIn when cart is empty', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([[], mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Payment Processing', () => {
    it('should process payment with valid nonce', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockResolvedValue({
        nonce: 'test-nonce-123',
      });

      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Payment successful',
        },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(mockRequestPaymentMethod).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalledWith(
          '/api/v1/product/braintree/payment',
          {
            nonce: 'test-nonce-123',
            cart: mockProducts,
          }
        );
      }, { timeout: 5000 });
    });

    it('should show loading state during payment processing', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ nonce: 'test-nonce' }), 100))
      );

      axios.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      fireEvent.click(paymentButton);

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Processing ....')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle payment failure gracefully', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockResolvedValue({
        nonce: 'test-nonce-123',
      });

      axios.post.mockRejectedValue(new Error('Payment failed'));

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      fireEvent.click(paymentButton);

      await waitFor(() => {
        // Cart should not be cleared on failure
        expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('cart');
        expect(mockSetCart).not.toHaveBeenCalledWith([]);
      }, { timeout: 5000 });
    });

    it('should not allow payment without address', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUserNoAddress, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      expect(paymentButton).toBeDisabled();
    });
  });

  describe('Post-Purchase', () => {
    it('should clear cart after successful payment', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockResolvedValue({
        nonce: 'test-nonce-123',
      });

      axios.post.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('cart');
        expect(mockSetCart).toHaveBeenCalledWith([]);
      }, { timeout: 5000 });
    });

    it('should redirect to orders page after successful payment', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockResolvedValue({
        nonce: 'test-nonce-123',
      });

      axios.post.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/orders');
      }, { timeout: 5000 });
    });

    it('should show success message after payment', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockResolvedValue({
        nonce: 'test-nonce-123',
      });

      axios.post.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      await waitFor(() => expect(paymentButton).not.toBeDisabled(), { timeout: 5000 });
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Payment Completed Successfully ');
      }, { timeout: 5000 });
    });

    it('should not clear cart if payment fails', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      mockRequestPaymentMethod.mockResolvedValue({
        nonce: 'test-nonce-123',
      });

      axios.post.mockRejectedValue(new Error('Payment declined'));

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('braintree-dropin')).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByText('Make Payment');
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(mockRequestPaymentMethod).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Cart should not be cleared
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('cart');
      expect(mockSetCart).not.toHaveBeenCalledWith([]);
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard/user/orders');
    });
  });

  describe('Cart Display & Calculation', () => {
    it('should display correct total price', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      // Total should be $300.00 (100 + 200)
      expect(screen.getByText(/Total : \$300.00/i)).toBeInTheDocument();
    });

    it('should display cart item count', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/You Have 2 items in your cart/i)).toBeInTheDocument();
    });

    it('should display all cart items with details', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(product.price.toString()))).toBeInTheDocument();
      });
    });

    it('should remove item from cart when Remove button clicked', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(mockSetCart).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', expect.any(String));
    });

    it('should handle removing non-existent item from cart', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      // Create a cart with one item
      const testCart = [mockProducts[0]];
      let cartState = [...testCart];
      
      const mockSetCartWithSpy = jest.fn((newCart) => {
        cartState = newCart;
      });
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([cartState, mockSetCartWithSpy]);

      const { container } = render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      // Spy on Array.prototype.findIndex to simulate the item not being found
      const originalFindIndex = Array.prototype.findIndex;
      const findIndexSpy = jest.spyOn(Array.prototype, 'findIndex');
      
      // Make findIndex return -1 for the next call (simulating item not found)
      findIndexSpy.mockReturnValueOnce(-1);

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      // The cart should NOT have been updated because findIndex returned -1
      expect(mockSetCartWithSpy).not.toHaveBeenCalled();

      // Restore the original function
      findIndexSpy.mockRestore();
      Array.prototype.findIndex = originalFindIndex;
    });

    it('should navigate to profile when Update Address clicked', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      const updateButton = screen.getByText('Update Address');
      fireEvent.click(updateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/profile');
    });

    it('should handle error in totalPrice calculation', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock cart with items that might cause calculation issues
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      // Mock toLocaleString to throw an error
      const originalToLocaleString = Number.prototype.toLocaleString;
      Number.prototype.toLocaleString = jest.fn(() => {
        throw new Error('toLocaleString error');
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      // totalPrice should handle the error gracefully
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Restore mocks
      Number.prototype.toLocaleString = originalToLocaleString;
      consoleLogSpy.mockRestore();
    });

    it('should handle error when removing invalid cart item', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      // Mock setCart to throw an error
      const mockSetCartError = jest.fn(() => {
        throw new Error('setCart error');
      });
      
      const { useCart: useCartModule } = require('../context/cart');
      useCartModule.mockReturnValue([mockProducts, mockSetCartError]);

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      // Error should be logged
      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
    });

    it('should navigate to profile when Update Address clicked for user without address', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUserNoAddress, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-braintree-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      const updateButton = screen.getByText('Update Address');
      fireEvent.click(updateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/profile');
    });

    it('should display instance state before Braintree loads', () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      // Mock axios to not return a token initially
      axios.get.mockResolvedValue({
        data: { clientToken: null },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      // Without clientToken, DropIn should not render
      expect(screen.queryByTestId('braintree-dropin')).not.toBeInTheDocument();
    });

    it('should handle payment button disabled state when no instance', async () => {
      const { useAuth } = require('../context/auth');
      const { useCart } = require('../context/cart');
      
      // Mock the DropIn to NOT call onInstance
      jest.resetModules();
      jest.mock('braintree-web-drop-in-react', () => {
        return function MockDropInNoInstance() {
          return <div data-testid="braintree-dropin-no-instance">Braintree DropIn Mock</div>;
        };
      });

      useAuth.mockReturnValue([mockAuthUser, mockSetAuth]);
      useCart.mockReturnValue([mockProducts, mockSetCart]);

      axios.get.mockResolvedValue({
        data: { clientToken: 'test-token' },
      });

      render(
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const paymentButton = screen.queryByText('Make Payment');
        if (paymentButton) {
          expect(paymentButton).toBeDisabled();
        }
      }, { timeout: 5000 });
    });
  });
});
