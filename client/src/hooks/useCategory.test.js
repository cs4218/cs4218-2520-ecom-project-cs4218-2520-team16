/*
Name: Wang Zihan
Student ID: A0266073A
With suggestions and helps from ChatGPT 5.2 Thinking
*/

import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

jest.mock("axios");

describe("useCategory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("fetches categories on mount and returns them", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: {
        category: [
          { _id: "1", name: "Books", slug: "books" },
          { _id: "2", name: "Electronics", slug: "electronics" },
        ],
      },
    });

    // Act
    const { result } = renderHook(() => useCategory());

    // Assert
    expect(result.current).toEqual([]); // initial state
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    expect(result.current[0].name).toBe("Books");
    expect(result.current[1].slug).toBe("electronics");
  });

  test("returns [] when API returns missing/non-array category", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: {
        category: undefined,
      },
    });

    // Act
    const { result } = renderHook(() => useCategory());

    // Assert
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  test("logs error and keeps [] when request fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const err = new Error("network error");
    axios.get.mockRejectedValueOnce(err);

    // Act
    const { result } = renderHook(() => useCategory());

    // Assert
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
    expect(consoleSpy).toHaveBeenCalledWith(err);

    consoleSpy.mockRestore();
  });
});