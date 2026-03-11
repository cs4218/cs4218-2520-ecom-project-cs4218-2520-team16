import { useState, useEffect } from "react";
import axios from "axios";

export default function useCategory() {
  const [categories, setCategories] = useState([]);

  // Rewrote this to be more typesafe Wen Han Tang A0340008W
  const getCategories = async () => {
    try {
      const response = await axios.get("/api/v1/category/get-category");
      setCategories(response?.data?.category || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return categories;
}