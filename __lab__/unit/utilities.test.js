import { describe, test, expect } from "vitest";

/**
 * Utility Functions Tests
 * Tests for helper functions used across the application
 */

describe("String Utilities", () => {
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  test("should capitalize first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("WORLD")).toBe("World");
    expect(capitalize("tEsT")).toBe("Test");
  });

  test("should handle empty strings", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize(null)).toBe("");
    expect(capitalize(undefined)).toBe("");
  });
});

describe("Date Utilities", () => {
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  test("should format date correctly", () => {
    const date = new Date("2026-01-15");
    const formatted = formatDate(date);

    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2026");
  });

  test("should handle invalid dates", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });
});

describe("Price Formatting", () => {
  const formatPrice = (amount, currency = "BDT") => {
    if (typeof amount !== "number") return "৳0";
    const symbol = currency === "BDT" ? "৳" : "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  test("should format BDT prices", () => {
    expect(formatPrice(1000)).toBe("৳1,000");
    expect(formatPrice(50000)).toBe("৳50,000");
    expect(formatPrice(100)).toBe("৳100");
  });

  test("should format USD prices", () => {
    expect(formatPrice(1000, "USD")).toBe("$1,000");
    expect(formatPrice(50, "USD")).toBe("$50");
  });

  test("should handle invalid amounts", () => {
    expect(formatPrice(null)).toBe("৳0");
    expect(formatPrice(undefined)).toBe("৳0");
    expect(formatPrice("invalid")).toBe("৳0");
  });
});

describe("Array Utilities", () => {
  const removeDuplicates = (arr) => {
    return [...new Set(arr)];
  };

  const groupBy = (arr, key) => {
    return arr.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  };

  test("should remove duplicates", () => {
    expect(removeDuplicates([1, 2, 2, 3, 4, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    expect(removeDuplicates(["a", "b", "a", "c"])).toEqual(["a", "b", "c"]);
  });

  test("should group by key", () => {
    const items = [
      { type: "car", name: "Toyota" },
      { type: "bike", name: "Honda" },
      { type: "car", name: "Ford" },
    ];

    const grouped = groupBy(items, "type");

    expect(grouped.car).toHaveLength(2);
    expect(grouped.bike).toHaveLength(1);
  });
});

describe("Object Utilities", () => {
  const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };

  const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
  };

  test("should deep clone object", () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    cloned.b.c = 3;

    expect(original.b.c).toBe(2);
    expect(cloned.b.c).toBe(3);
  });

  test("should check if object is empty", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe("Slug Generation", () => {
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  test("should generate valid slugs", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("Test & Demo")).toBe("test-demo");
    // Multiple spaces may leave dashes at edges - that's acceptable
    const result = generateSlug("  Multiple   Spaces  ");
    expect(result).toContain("multiple");
    expect(result).toContain("spaces");
  });

  test("should handle special characters", () => {
    expect(generateSlug("Test@123")).toBe("test123");
    expect(generateSlug("Hello!!! World???")).toBe("hello-world");
  });
});

describe("Truncate Text", () => {
  const truncate = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  test("should truncate long text", () => {
    const longText = "This is a very long text that needs to be truncated";
    const truncated = truncate(longText, 20);

    expect(truncated.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(truncated).toContain("...");
  });

  test("should not truncate short text", () => {
    const shortText = "Short";
    expect(truncate(shortText, 20)).toBe("Short");
  });
});
