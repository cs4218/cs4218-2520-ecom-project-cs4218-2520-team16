// Wen Han Tang A0340008W
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

import { AuthProvider } from "../context/auth";
import PrivateRoute from "../components/Routes/Private";
import AdminRoute from "../components/Routes/AdminRoute";

jest.mock("axios");

function PrivateHarness() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={["/dashboard/user"]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route path="user" element={<div>User Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function AdminHarness() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={["/dashboard/admin"]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="admin" element={<div>Admin Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("Protected routes integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults = { headers: { common: {} } };
  });

  test("private route renders outlet when user auth API returns ok", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { _id: "u1", name: "Alice", role: 0 },
        token: "token-user",
      })
    );
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(<PrivateHarness />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
      expect(screen.getByText("User Dashboard")).toBeInTheDocument();
    });
  });

  test("private route blocks unauthenticated users", async () => {
    render(<PrivateHarness />);

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
      expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
    });
  });

  test("admin route renders outlet only for admin-auth success", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { _id: "a1", name: "Admin", role: 1 },
        token: "token-admin",
      })
    );
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(<AdminHarness />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });

  test("admin route blocks non-admin auth responses", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { _id: "u1", name: "Alice", role: 0 },
        token: "token-user",
      })
    );
    axios.get.mockResolvedValue({ data: { ok: false } });

    render(<AdminHarness />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
    });
  });
});
