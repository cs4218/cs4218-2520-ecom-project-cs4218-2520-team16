// Wen Han Tang A0340008W
import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";

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

describe("Users Component", () => {
	test("renders page heading", () => {
			// Arrange

			// Act
		render(<Users />);

			// Assert

		expect(screen.getByRole("heading", { name: "All Users" })).toBeInTheDocument();
	});

	test("passes correct title to Layout", () => {
			// Arrange

			// Act
		render(<Users />);

			// Assert

		const layout = screen.getByTestId("layout");
		expect(layout).toHaveAttribute("data-title", "Dashboard - All Users");
	});

	test("renders admin menu", () => {
			// Arrange

			// Act
		render(<Users />);

			// Assert

		expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
	});

	test("renders expected layout structure", () => {
			// Arrange

			// Act
		const { container } = render(<Users />);

			// Assert

		const outer = container.querySelector(".container-fluid.m-3.p-3");
		const row = container.querySelector(".row");
		const leftCol = container.querySelector(".col-md-3");
		const rightCol = container.querySelector(".col-md-9");

		expect(outer).toBeInTheDocument();
		expect(row).toBeInTheDocument();
		expect(leftCol).toBeInTheDocument();
		expect(rightCol).toBeInTheDocument();
	});
});