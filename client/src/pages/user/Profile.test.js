// Wen Han Tang A0340008W
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import toast from 'react-hot-toast';
import Profile from './Profile';

jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../components/Layout', () => ({ children }) => (
	<div data-testid="layout">{children}</div>
));

jest.mock('../../components/UserMenu', () => () => (
	<div data-testid="user-menu">UserMenu</div>
));

const mockSetAuth = jest.fn();
const mockAuthState = {
	user: {
		name: 'John Doe',
		email: 'john@example.com',
		phone: '1234567890',
		address: '123 Street'
	},
	token: 'mock-token'
};

jest.mock('../../context/auth', () => ({
	useAuth: jest.fn(() => [mockAuthState, mockSetAuth])
}));

Object.defineProperty(window, 'localStorage', {
	value: {
		setItem: jest.fn(),
		getItem: jest.fn(),
		removeItem: jest.fn()
	},
	writable: true
});

describe('Profile Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		window.localStorage.getItem.mockReturnValue(JSON.stringify({
			user: { ...mockAuthState.user },
			token: mockAuthState.token
		}));
	});

	it('renders profile form with prefilled user data', async () => {
		const { getByText, getByPlaceholderText } = render(<Profile />);

		expect(getByText('USER PROFILE')).toBeInTheDocument();

		await waitFor(() => {
			expect(getByPlaceholderText('Enter Your Name').value).toBe('John Doe');
		});

		expect(getByPlaceholderText('Enter Your Email').value).toBe('john@example.com');
		expect(getByPlaceholderText('Enter Your Email')).toBeDisabled();
		expect(getByPlaceholderText('Enter Your Phone').value).toBe('1234567890');
		expect(getByPlaceholderText('Enter Your Address').value).toBe('123 Street');
	});

	it('updates the profile successfully', async () => {
		axios.put.mockResolvedValueOnce({
			data: {
				updatedUser: {
					name: 'Jane Doe',
					email: 'john@example.com',
					phone: '0987654321',
					address: '456 Avenue'
				}
			}
		});

		const { getByPlaceholderText, getByText } = render(<Profile />);

		fireEvent.change(getByPlaceholderText('Enter Your Name'), {
			target: { value: 'Jane Doe' }
		});
		fireEvent.change(getByPlaceholderText('Enter Your Password'), {
			target: { value: 'newpass123' }
		});
		fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
			target: { value: '0987654321' }
		});
		fireEvent.change(getByPlaceholderText('Enter Your Address'), {
			target: { value: '456 Avenue' }
		});

		fireEvent.click(getByText('UPDATE'));

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(mockSetAuth).toHaveBeenCalledWith({
			...mockAuthState,
			user: {
				name: 'Jane Doe',
				email: 'john@example.com',
				phone: '0987654321',
				address: '456 Avenue'
			}
		});
		expect(window.localStorage.setItem).toHaveBeenCalled();
		expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
	});

	it('sends updated payload to the API', async () => {
		axios.put.mockResolvedValueOnce({
			data: {
				updatedUser: {
					name: 'Jane Doe',
					email: 'john@example.com',
					phone: '0987654321',
					address: '456 Avenue'
				}
			}
		});

		const { getByPlaceholderText, getByText } = render(<Profile />);

		fireEvent.change(getByPlaceholderText('Enter Your Name'), {
			target: { value: 'Jane Doe' }
		});
		fireEvent.change(getByPlaceholderText('Enter Your Password'), {
			target: { value: 'newpass123' }
		});
		fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
			target: { value: '0987654321' }
		});
		fireEvent.change(getByPlaceholderText('Enter Your Address'), {
			target: { value: '456 Avenue' }
		});

		fireEvent.click(getByText('UPDATE'));

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
			name: 'Jane Doe',
			email: 'john@example.com',
			password: 'newpass123',
			phone: '0987654321',
			address: '456 Avenue'
		});
	});

	it('shows API error message when response has errro flag', async () => {
		axios.put.mockResolvedValueOnce({
			data: {
				errro: true,
				error: 'Update rejected'
			}
		});

		const { getByText } = render(<Profile />);

		fireEvent.click(getByText('UPDATE'));

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith('Update rejected');
		expect(mockSetAuth).not.toHaveBeenCalled();
		expect(window.localStorage.setItem).not.toHaveBeenCalled();
		expect(toast.success).not.toHaveBeenCalled();
	});

	it('shows API error message when response has error string', async () => {
		axios.put.mockResolvedValueOnce({
			data: {
				error: 'Email already taken'
			}
		});

		const { getByText } = render(<Profile />);

		fireEvent.click(getByText('UPDATE'));

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith('Email already taken');
		expect(mockSetAuth).not.toHaveBeenCalled();
		expect(window.localStorage.setItem).not.toHaveBeenCalled();
		expect(toast.success).not.toHaveBeenCalled();
	});

	it('shows an error message when update fails', async () => {
		axios.put.mockRejectedValueOnce(new Error('Update failed'));

		const { getByText } = render(<Profile />);

		fireEvent.click(getByText('UPDATE'));

		await waitFor(() => expect(axios.put).toHaveBeenCalled());
		expect(toast.error).toHaveBeenCalledWith('Something went wrong');
	});
});