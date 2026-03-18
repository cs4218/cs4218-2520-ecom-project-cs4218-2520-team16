// Wen Han Tang A0340008W
/* eslint-disable testing-library/no-node-access */
// Xiao Ao A0273305L - update unit test due to bug fix in Search.js

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Search from "./Search";
import SearchInput from "../components/Form/SearchInput";
import { useSearch } from "../context/search";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";

jest.mock("axios");
jest.mock("../context/search", () => {
	const actual = jest.requireActual("../context/search");
	return {
		...actual,
		useSearch: jest.fn(),
	};
});

jest.mock("../context/cart", () => ({
	useCart: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: { success: jest.fn() },
}));

jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: jest.fn(),
}));

jest.mock("../components/Layout", () => {
	return function MockLayout({ children, title }) {
		return (
			<div data-testid="layout" data-title={title}>
				{children}
			</div>
		);
	};
});

describe("Search element", () => {
	const mockSetValues = jest.fn();
	const actualSearch = jest.requireActual("../context/search");

	beforeEach(() => {
		jest.clearAllMocks();
		useCart.mockReturnValue([[], jest.fn()]);
	});

	test("renders empty-state when no results exist", () => {
		// Arrange
		useSearch.mockReturnValue([
			{ keyword: "", results: [] },
			mockSetValues,
		]);

		// Act
		render(<Search />);

		// Assert
		expect(screen.getByText("Search Resuts")).toBeInTheDocument();
		expect(screen.getByText("No Products Found")).toBeInTheDocument();
	});

	test("renders results with counts and product details", () => {
		// Arrange
		const results = [
			{
				_id: "p1",
				name: "Running Shoe",
				description: "Lightweight trainer for daily runs",
				price: 99,
			},
			{
				_id: "p2",
				name: "Trail Boot",
				description: "Grippy outsole for rugged terrain",
				price: 149,
			},
		];
		useSearch.mockReturnValue([
			{ keyword: "shoe", results },
			mockSetValues,
		]);

		// Act
		render(<Search />);

		// Assert
		expect(screen.getByText("Found 2")).toBeInTheDocument();
		expect(screen.getByText("Running Shoe")).toBeInTheDocument();
		expect(screen.getByText("Trail Boot")).toBeInTheDocument();
		expect(screen.getAllByText(/ADD TO CART/i)).toHaveLength(2);
		expect(screen.getAllByText(/More Details/i)).toHaveLength(2);

		const images = document.querySelectorAll("img.card-img-top");
		expect(images[0]).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/p1"
		);
		expect(images[1]).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/p2"
		);
	});

	test("clicking More Details navigates to product details page", async () => {
		// Arrange
		const mockNavigate = jest.fn();
		useNavigate.mockReturnValue(mockNavigate);
		useSearch.mockReturnValue([
			{ keyword: "shoe", results: [{ _id: "p1", name: "Running Shoe", description: "Lightweight trainer", price: 99, slug: "running-shoe" }] },
			mockSetValues,
		]);

		// Act
		render(<Search />);
		await act(async () => {
			await userEvent.click(screen.getByText("More Details"));
		});

		// Assert
		expect(mockNavigate).toHaveBeenCalledWith("/product/running-shoe");
	});

	test("clicking ADD TO CART adds product to cart and saves to localStorage", async () => {
		// Arrange
		const mockSetCart = jest.fn();
		useCart.mockReturnValue([[], mockSetCart]);
		useSearch.mockReturnValue([
			{ keyword: "shoe", results: [{ _id: "p1", name: "Running Shoe", description: "Lightweight trainer", price: 99, slug: "running-shoe" }] },
			mockSetValues,
		]);

		// Act
		render(<Search />);
		await act(async () => {
			await userEvent.click(screen.getByText("ADD TO CART"));
		});

		// Assert
		expect(mockSetCart).toHaveBeenCalled();
		expect(JSON.parse(localStorage.getItem("cart"))[0]._id).toBe("p1");
	});

	test("updates keyword when typing in search input", async () => {
		// Arrange
		useSearch.mockImplementation(actualSearch.useSearch);

		// Act
		render(
			<actualSearch.SearchProvider>
				<SearchInput />
			</actualSearch.SearchProvider>
		);
		const input = screen.getByRole("searchbox");
		await act(async () => {
			await userEvent.type(input, "laptop");
		});

		// Assert
		expect(input).toHaveValue("laptop");
	});

	test("submits search, stores results, and navigates", async () => {
		// Arrange
		const mockNavigate = jest.fn();
		useNavigate.mockReturnValue(mockNavigate);
		const currentValues = { keyword: "laptop", results: [] };
		const apiResults = [{ _id: "p3" }];
		useSearch.mockReturnValue([currentValues, mockSetValues]);
		axios.get.mockResolvedValue({ data: apiResults });

		// Act
		render(<SearchInput />);
		const submitButton = screen.getByRole("button", { name: /search/i });
		await act(async () => {
			await userEvent.click(submitButton);
		});

		// Assert
		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith(
				"/api/v1/product/search/laptop"
			);
		});
		expect(mockSetValues).toHaveBeenCalledWith({
			...currentValues,
			results: apiResults,
		});
		expect(mockNavigate).toHaveBeenCalledWith("/search");
	});
});
