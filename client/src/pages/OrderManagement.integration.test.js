/**
 * Integration Tests for Order Management
 * Author: Aum Chotaliya
 * Student ID: A0338423E
 * Testing user orders and admin order management flows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Orders from './user/Orders';
import AdminOrders from './admin/AdminOrders';
import axios from 'axios';
import moment from 'moment';

// Mock dependencies
jest.mock('axios');
jest.mock('moment');

// Mock Layout
jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return <div data-testid="layout" data-title={title}>{children}</div>;
  };
});

// Mock UserMenu
jest.mock('../components/UserMenu', () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Mock AdminMenu
jest.mock('../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});

// Mock antd Select with proper Option export
jest.mock('antd', () => {
  const React = require('react');
  
  const MockSelect = ({ children, onChange, defaultValue, ...props }) => (
    <select
      data-testid={props['data-testid']}
      onChange={(e) => onChange && onChange(e.target.value)}
      defaultValue={defaultValue}
    >
      {children}
    </select>
  );

  const MockOption = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  MockSelect.Option = MockOption;

  return {
    Select: MockSelect,
  };
});

// Mock context
const mockSetAuth = jest.fn();

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(),
}));

describe('Order Management Integration Tests', () => {
  jest.setTimeout(30000);

  const mockUserAuth = {
    token: 'user-token',
    user: {
      _id: 'user123',
      name: 'Test User',
      email: 'user@test.com',
    },
  };

  const mockAdminAuth = {
    token: 'admin-token',
    user: {
      _id: 'admin123',
      name: 'Admin User',
      email: 'admin@test.com',
      role: 1,
    },
  };

  const mockOrders = [
    {
      _id: 'order1',
      status: 'Not Process',
      buyer: {
        _id: 'user123',
        name: 'Test User',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      payment: {
        success: true,
      },
      products: [
        {
          _id: 'prod1',
          name: 'Product 1',
          description: 'Description for product 1',
          price: 100,
        },
        {
          _id: 'prod2',
          name: 'Product 2',
          description: 'Description for product 2',
          price: 200,
        },
      ],
    },
    {
      _id: 'order2',
      status: 'Processing',
      buyer: {
        _id: 'user456',
        name: 'Another User',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
      payment: {
        success: false,
      },
      products: [
        {
          _id: 'prod3',
          name: 'Product 3',
          description: 'Description for product 3',
          price: 150,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    moment.mockImplementation((date) => ({
      fromNow: () => '2 days ago',
    }));
  });

  describe('User Orders', () => {
    it('should fetch and display user orders on mount', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockUserAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
      }, { timeout: 5000 });
    });

    it('should display order products with populated details', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockUserAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Description for product 1')).toBeInTheDocument();
        expect(screen.getByText('Price : 100')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should load product photos for each item', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockUserAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('src', '/api/v1/product/product-photo/prod1');
        expect(images[1]).toHaveAttribute('src', '/api/v1/product/product-photo/prod2');
      }, { timeout: 5000 });
    });

    it('should format dates using moment.js', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockUserAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Just check that the orders are rendered with dates
        expect(screen.getAllByText('2 days ago')).toHaveLength(2);
      }, { timeout: 5000 });

      // Moment should have been called with dates from the orders
      expect(moment).toHaveBeenCalled();
    });

    it('should only display when user is authenticated', () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([null, mockSetAuth]);

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockUserAuth, mockSetAuth]);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      axios.get.mockRejectedValue(new Error('API Error'));

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled();
      }, { timeout: 5000 });

      consoleLogSpy.mockRestore();
    });

    it('should display payment status correctly', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockUserAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Admin Orders', () => {
    it('should fetch all orders from all users on mount', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
      }, { timeout: 5000 });
    });

    it('should display all orders from different users', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Another User')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display status dropdown for each order', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const selects = screen.getAllByTestId('status-select');
        expect(selects).toHaveLength(2);
      }, { timeout: 5000 });
    });

    it('should have all status options in dropdown', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Not Process')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Shipped')).toBeInTheDocument();
        expect(screen.getByText('deliverd')).toBeInTheDocument();
        expect(screen.getByText('cancel')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should call PUT API when status is changed', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'Processing' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/auth/order-status/order1',
          { status: 'Processing' }
        );
      }, { timeout: 5000 });
    });

    it('should refresh orders after status update', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'Shipped' } });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
      }, { timeout: 5000 });
    });

    it('should handle status update to deliverd', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'deliverd' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/auth/order-status/order1',
          { status: 'deliverd' }
        );
      }, { timeout: 5000 });
    });

    it('should handle API errors during status update', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      axios.put.mockRejectedValue(new Error('Update failed'));

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'Processing' } });

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled();
      }, { timeout: 5000 });

      consoleLogSpy.mockRestore();
    });

    it('should handle empty orders array', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-menu')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle non-array response gracefully', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: null,
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-menu')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display order with all buyer information', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: mockOrders,
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Price : 100')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle orders with missing optional fields', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithMissingFields = {
        _id: 'order3',
        status: null,
        buyer: null,
        payment: null,
        products: [],
      };

      axios.get.mockResolvedValue({
        data: [orderWithMissingFields],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-menu')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should not fetch orders when admin is not authenticated', () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([null, mockSetAuth]);

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle API error and set empty orders array', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      axios.get.mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled();
      }, { timeout: 5000 });

      consoleLogSpy.mockRestore();
    });

    it('should handle orders with empty products array', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithEmptyProducts = {
        _id: 'order-empty',
        status: 'Processing',
        buyer: { name: 'Test Buyer' },
        payment: { success: true },
        products: [],
      };

      axios.get.mockResolvedValue({
        data: [orderWithEmptyProducts],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Buyer')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle orders with null products', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithNullProducts = {
        _id: 'order-null',
        status: 'Processing',
        buyer: { name: 'Test Buyer' },
        payment: { success: true },
        products: null,
      };

      axios.get.mockResolvedValue({
        data: [orderWithNullProducts],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Buyer')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle products with missing fields', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithMissingProductFields = {
        _id: 'order-missing',
        status: 'Processing',
        buyer: { name: 'Test Buyer' },
        payment: { success: true },
        products: [
          {
            _id: 'prod-incomplete',
            name: null,
            description: null,
            price: null,
          },
        ],
      };

      axios.get.mockResolvedValue({
        data: [orderWithMissingProductFields],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Buyer')).toBeInTheDocument();
        expect(screen.getByText('Price : 0')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle order with no _id using index as key', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithoutId = {
        _id: null,
        status: null,
        buyer: { name: 'No ID Buyer' },
        payment: { success: true },
        products: [],
      };

      axios.get.mockResolvedValue({
        data: [orderWithoutId],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No ID Buyer')).toBeInTheDocument();
        const select = screen.getByTestId('status-select');
        // When status is null, it should default to status[0] which is "Not Process"
        expect(select).toHaveValue('Not Process');
      }, { timeout: 5000 });
    });

    it('should handle products without _id using index as key', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithProductsWithoutId = {
        _id: 'order-prod-no-id',
        status: 'Processing',
        buyer: { name: 'Test Buyer' },
        payment: { success: true },
        products: [
          {
            _id: null,
            name: 'No ID Product',
            description: 'Test description',
            price: 100,
          },
        ],
      };

      axios.get.mockResolvedValue({
        data: [orderWithProductsWithoutId],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No ID Product')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
    it('should handle order with missing buyer name', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithNoBuyerName = {
        _id: 'order-no-buyer-name',
        status: 'Processing',
        buyer: null,
        payment: { success: true },
        products: [],
      };

      axios.get.mockResolvedValue({
        data: [orderWithNoBuyerName],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle order with no createAt date', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const orderWithNoDate = {
        _id: 'order-no-date',
        status: 'Processing',
        buyer: { name: 'Test Buyer' },
        createAt: null,
        payment: { success: true },
        products: [],
      };

      axios.get.mockResolvedValue({
        data: [orderWithNoDate],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Buyer')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Order Status Workflow', () => {
    it('should display new order with initial status "Not Process"', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const newOrder = {
        ...mockOrders[0],
        status: 'Not Process',
      };

      axios.get.mockResolvedValue({
        data: [newOrder],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const select = screen.getByTestId('status-select');
        expect(select).toHaveValue('Not Process');
      }, { timeout: 5000 });
    });

    it('should allow admin to change status from Not Process to Processing', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'Processing' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/auth/order-status/order1',
          { status: 'Processing' }
        );
      }, { timeout: 5000 });
    });

    it('should allow status change to Shipped', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'Shipped' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/auth/order-status/order1',
          { status: 'Shipped' }
        );
      }, { timeout: 5000 });
    });

    it('should mark order as complete when status is deliverd', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [{ ...mockOrders[0], status: 'Processing' }],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'deliverd' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/auth/order-status/order1',
          { status: 'deliverd' }
        );
      }, { timeout: 5000 });
    });

    it('should allow status change to cancel', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      axios.put.mockResolvedValue({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'cancel' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/v1/auth/order-status/order1',
          { status: 'cancel' }
        );
      }, { timeout: 5000 });
    });

    it('should handle non-array status gracefully', async () => {
      const { useAuth } = require('../context/auth');
      useAuth.mockReturnValue([mockAdminAuth, mockSetAuth]);

      const React = require('react');
      const originalUseState = React.useState;
      let callCount = 0;

      jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
        callCount++;
        // The status state is the second useState call in AdminOrders
        if (callCount === 2 && Array.isArray(initialValue) && initialValue.includes('Not Process')) {
          // Return null instead of the array to trigger the defensive branch
          return [null, jest.fn()];
        }
        return originalUseState(initialValue);
      });

      axios.get.mockResolvedValue({
        data: [mockOrders[0]],
      });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
      }, { timeout: 5000 });

      React.useState.mockRestore();
    });
  });
});
