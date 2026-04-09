import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("../../components/Layout", () => {
	return function MockLayout({ children, title }) {
		return (
			<div data-testid="layout" data-title={title}>
				{children}
			</div>
		);
	};
});
jest.mock("../../components/AdminMenu", () => {
	return function MockAdminMenu() {
		return <div data-testid="admin-menu">Admin Menu</div>;
	};
});
jest.mock("../../components/Form/CategoryForm", () => {
	return function MockCategoryForm({ value = "", setValue = () => {}, handleSubmit }) {
		return (
			<form onSubmit={handleSubmit}>
				<input
					aria-label="category-name"
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
				<button type="submit">Submit</button>
			</form>
		);
	};
});

describe("CreateCategory", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		axios.get.mockResolvedValue({ data: { success: true, category: [] } });
	});

	it("renders the category management page", async () => {
		render(<CreateCategory />);

		expect(screen.getByTestId("layout")).toHaveAttribute(
			"data-title",
			"Dashboard - Create Category"
		);
		expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Manage Category" })).toBeInTheDocument();

		await waitFor(() => {
			expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
		});
	});
});
