/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import React from 'react'; // Import React explicitly in the test file
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from './cart'; // Adjust the import path
import { jest } from '@jest/globals';

beforeEach(() => {
  // Clear localStorage before each test to ensure a clean state
  localStorage.clear();
});

describe('CartProvider and useCart hook', () => {
  it('should initialize cart from localStorage', () => {
    // Mock localStorage with some existing cart data
    localStorage.setItem('cart', JSON.stringify([{ id: 1, name: 'Product 1', quantity: 1 }]));

    // Render the CartProvider with a child component using useCart
    const TestComponent = () => {
      const [cart] = useCart();
      return <div>{cart.length}</div>;
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Test that the cart is initialized correctly from localStorage
    expect(screen.getByText('1')).toBeInTheDocument(); // Cart should have 1 item
  });

  it('should update the cart state', () => {
    // Render the CartProvider with a child component using useCart
    const TestComponent = () => {
      const [cart, setCart] = useCart();

      const addItem = () => {
        setCart([...cart, { id: 2, name: 'Product 2', quantity: 1 }]);
      };

      return (
        <div>
          <div data-testid="cart-count">{cart.length}</div>
          <button onClick={addItem}>Add Item</button>
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Initially, the cart should be empty
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    // Click the "Add Item" button and check the cart count
    act(() => {
      screen.getByText('Add Item').click();
    });

    // Now, the cart should have 1 item
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
  });

  it('should persist cart in localStorage after update', () => {
    // Render the CartProvider with a child component using useCart
    const TestComponent = () => {
      const [cart, setCart] = useCart();

      const addItem = () => {
        setCart([...cart, { id: 3, name: 'Product 3', quantity: 1 }]);
      };

      return (
        <div>
          <div data-testid="cart-count">{cart.length}</div>
          <button onClick={addItem}>Add Item</button>
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Initially, the cart should be empty
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    // Click the "Add Item" button
    act(() => {
      screen.getByText('Add Item').click();
    });

    // Cart should now have 1 item
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');

    // Check that the cart is saved to localStorage
    const savedCart = JSON.parse(localStorage.getItem('cart'));
    debugger
    expect(savedCart.length).toBe(1);
    expect(savedCart[0].name).toBe('Product 3');
  });
});