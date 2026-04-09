// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import React from "react";
import '@testing-library/jest-dom';

jest.mock("antd", () => {
	const actualAntd = jest.requireActual("antd");

	const MockOption = ({ children, value }) => <option value={value}>{children}</option>;

	const MockSelect = ({ children, onChange, value, placeholder }) => {
		const testId = placeholder
			? `select-${placeholder.trim().toLowerCase().replace(/\s+/g, "-")}`
			: "select";

		return (
			<select
				data-testid={testId}
				value={value}
				onChange={(e) => onChange?.(e.target.value)}
			>
				{children}
			</select>
		);
	};
	MockSelect.Option = MockOption;

	const MockModal = ({ open, visible, children }) => {
		const isOpen = open ?? visible;
		if (!isOpen) return null;
		return <div data-testid="modal">{children}</div>;
	};

	return {
		...actualAntd,
		Select: MockSelect,
		Modal: MockModal,
	};
});
