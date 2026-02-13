// Xiao Ao, A0273305L
// Code guided Github Copilot


/* eslint-disable import/first */
/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable testing-library/no-wait-for-multiple-assertions */

/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";

// Mock axios BEFORE importing auth.js
jest.mock("axios", () => ({
  defaults: {
    headers: {
      common: {},
    },
  },
}));

import axios from "axios";
import { AuthProvider, useAuth } from "./auth";

beforeEach(() => {
  // If your Jest setup uses fake timers globally, this is critical.
  jest.useRealTimers();

  localStorage.clear();
  axios.defaults.headers.common = {};
  jest.clearAllMocks();
});

test("SMOKE: this test must run (if it doesn't, Jest isn't discovering this file)", () => {
  expect(true).toBe(true);
});

const Viewer = () => {
  const [auth] = useAuth();
  return (
    <div>
      <div data-testid="name">{auth?.user?.name ?? "no-user"}</div>
      <div data-testid="token">{auth?.token ?? ""}</div>
    </div>
  );
};

test("hydrates from localStorage (covers auth.js lines 16-19)", async () => {
  const raw = JSON.stringify({
    user: { name: "Xiao Ao" },
    token: "valid-token-789",
  });
  localStorage.setItem("auth", raw);

  // Spies that will ONLY be called if lines 16-19 run.
  const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
  const jsonParseSpy = jest.spyOn(JSON, "parse");

  render(
    <AuthProvider>
      <Viewer />
    </AuthProvider>
  );

  // Flush effects/microtasks (helps in stricter environments)
  await act(async () => {});

  // 1) Verify the effect path actually executed:
  await waitFor(() => {
    expect(getItemSpy).toHaveBeenCalledWith("auth");
    expect(jsonParseSpy).toHaveBeenCalledWith(raw);
  });

  // 2) Verify state hydrated (result of setAuth in that block):
  await waitFor(() => {
    expect(screen.getByTestId("name")).toHaveTextContent("Xiao Ao");
    expect(screen.getByTestId("token")).toHaveTextContent("valid-token-789");
  });

  // 3) Verify axios default header sync after rerender:
  await waitFor(() => {
    expect(axios.defaults.headers.common.Authorization).toBe("valid-token-789");
  });

  getItemSpy.mockRestore();
  jsonParseSpy.mockRestore();
});

test("skips hydration when localStorage has no auth (covers if(data) false branch)", async () => {
  const getItemSpy = jest.spyOn(Storage.prototype, "getItem");

  render(
    <AuthProvider>
      <Viewer />
    </AuthProvider>
  );

  await act(async () => {});

  await waitFor(() => {
    expect(getItemSpy).toHaveBeenCalledWith("auth");
    expect(screen.getByTestId("name")).toHaveTextContent("no-user");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(axios.defaults.headers.common.Authorization).toBe("");
  });

  getItemSpy.mockRestore();
});

test("useAuth returns undefined outside provider", () => {
  const Outside = () => {
    const ctx = useAuth();
    return <div data-testid="ctx">{ctx ? "has" : "none"}</div>;
  };

  render(<Outside />);
  expect(screen.getByTestId("ctx")).toHaveTextContent("none");
});