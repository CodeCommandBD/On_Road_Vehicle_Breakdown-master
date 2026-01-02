# Loading Loader System - Usage Guide

এই প্রজেক্টে একটি **Global Loading System** implement করা হয়েছে যা redirect/navigation করার সময় একটি সুন্দর loading overlay দেখায়।

## 🎯 Features

- ✅ Beautiful animated loading spinner
- ✅ Backdrop blur effect
- ✅ Automatic loading state management
- ✅ Support for both regular and i18n routing
- ✅ Smooth transitions
- ✅ No flashing (300ms delay before hiding)

## 📦 Components Created

### 1. **LoadingProvider** (`components/providers/LoadingProvider.jsx`)

Global context provider যা loading state manage করে।

### 2. **LoadingOverlay** (`components/ui/LoadingOverlay.jsx`)

Loading spinner এবং overlay component।

### 3. **useRouterWithLoading** (`hooks/useRouterWithLoading.js`)

Custom hook যা Next.js router কে wrap করে এবং automatically loading state manage করে।

## 🚀 How to Use

### Method 1: Using Custom Hook (Recommended)

যেকোনো component এ যেখানে navigation করতে হবে:

```jsx
"use client";

import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

export default function MyComponent() {
  // For regular routing
  const router = useRouterWithLoading();

  // For i18n routing (যদি আপনার component i18n use করে)
  const router = useRouterWithLoading(true);

  const handleClick = () => {
    // এটা automatically loading দেখাবে
    router.push("/some-page");
  };

  return <button onClick={handleClick}>Go to Page</button>;
}
```

### Method 2: Manual Control (Advanced)

যদি আপনি manually loading control করতে চান:

```jsx
"use client";

import { useLoading } from "@/components/providers/LoadingProvider";
import { useRouter } from "next/navigation";

export default function MyComponent() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const handleCustomAction = async () => {
    startLoading();

    // Your async operation
    await someAsyncOperation();

    router.push("/some-page");

    // Stop loading after navigation
    setTimeout(() => stopLoading(), 500);
  };

  return <button onClick={handleCustomAction}>Custom Action</button>;
}
```

## 🔄 Migration Guide

### Before (Old Code):

```jsx
import { useRouter } from "@/i18n/routing";

const router = useRouter();
router.push("/dashboard");
```

### After (New Code):

```jsx
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

const router = useRouterWithLoading(true); // true for i18n
router.push("/dashboard"); // Loading automatically দেখাবে!
```

## 📝 Examples

### Example 1: Login Form (Already Updated)

```jsx
// components/auth/LoginForm.jsx
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

export default function LoginForm() {
  const router = useRouterWithLoading(true);

  const onSubmit = async (data) => {
    // ... login logic

    // Redirect with loading
    router.push("/admin/dashboard");
  };
}
```

### Example 2: Regular Component

```jsx
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

export default function MyComponent() {
  const router = useRouterWithLoading();

  return <button onClick={() => router.push("/pricing")}>View Pricing</button>;
}
```

### Example 3: With i18n Link

```jsx
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";

export default function Navigation() {
  const router = useRouterWithLoading(true); // i18n enabled

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <nav>
      <button onClick={() => handleNavigation("/about")}>About</button>
      <button onClick={() => handleNavigation("/contact")}>Contact</button>
    </nav>
  );
}
```

## 🎨 Customization

### Change Loading Spinner Style

Edit `components/ui/LoadingOverlay.jsx`:

```jsx
// Change spinner color
<div className="... border-t-blue-500 ...">  // Change to your color

// Change background opacity
<div className="... bg-black/50 ...">  // Adjust opacity

// Change spinner size
<div className="h-16 w-16 ...">  // Change size
```

### Change Loading Text

```jsx
<div className="text-white text-lg font-medium animate-pulse">
  Loading... // Change this text
</div>
```

### Add Bengali Translation

```jsx
import { useTranslations } from "next-intl";

export default function LoadingOverlay() {
  const t = useTranslations("Common");

  return (
    // ...
    <div className="text-white text-lg font-medium animate-pulse">
      {t("loading")}
    </div>
  );
}
```

## ⚠️ Important Notes

1. **LoadingProvider** already added to root layout - no need to add again
2. **LoadingOverlay** already added to root layout - no need to add again
3. Use `useRouterWithLoading(true)` for i18n routes
4. Use `useRouterWithLoading()` or `useRouterWithLoading(false)` for regular routes
5. Loading automatically stops after 500ms (configurable in the hook)

## 🐛 Troubleshooting

### Loading না দেখালে:

1. Check করুন `LoadingProvider` root layout এ আছে কিনা
2. Check করুন `LoadingOverlay` component render হচ্ছে কিনা
3. Console এ error আছে কিনা দেখুন

### Loading বেশি সময় থাকলে:

`hooks/useRouterWithLoading.js` এ timeout বাড়ান:

```jsx
setTimeout(() => {
  stopLoading();
}, 1000); // 500ms থেকে 1000ms করুন
```

## 📚 API Reference

### useRouterWithLoading(useI18n)

**Parameters:**

- `useI18n` (boolean, optional): `true` for i18n routing, `false` or omit for regular routing

**Returns:**

- Router object with methods: `push`, `replace`, `back`, `forward`

### useLoading()

**Returns:**

- `isLoading` (boolean): Current loading state
- `startLoading` (function): Start loading
- `stopLoading` (function): Stop loading

---

**Created by:** Md. Redwanul Haque & Team  
**Date:** January 2, 2026
