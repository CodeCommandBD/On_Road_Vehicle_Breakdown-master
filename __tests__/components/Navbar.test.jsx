import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key) => key,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock Redux
vi.mock("react-redux", () => ({
  useSelector: vi.fn((selector) => {
    if (selector.toString().includes("isAuthenticated")) return false;
    if (selector.toString().includes("user")) return null;
    if (selector.toString().includes("role")) return null;
    if (selector.toString().includes("unreadNotificationsCount")) return 0;
    return null;
  }),
  useDispatch: () => vi.fn(),
}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

// Mock custom hooks
vi.mock("@/hooks/useRouterWithLoading", () => ({
  useRouterWithLoading: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock i18n routing
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Navbar Component", () => {
  test("should render logo", async () => {
    const { default: Navbar } = await import("@/components/layout/Navbar");
    const { container } = render(<Navbar />);

    // Use container.querySelector instead of screen.getByAlt
    const logo = container.querySelector('img[alt="Logo"]');
    expect(logo).toBeInTheDocument();
  });

  test("should render navigation links", async () => {
    const { default: Navbar } = await import("@/components/layout/Navbar");
    render(<Navbar />);

    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.getByText("FIND GARAGE")).toBeInTheDocument();
    expect(screen.getByText("ABOUT")).toBeInTheDocument();
    expect(screen.getByText("SERVICES")).toBeInTheDocument();
  });

  test("should show login button when not authenticated", async () => {
    const { default: Navbar } = await import("@/components/layout/Navbar");
    render(<Navbar />);

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  test("should have mobile menu button", async () => {
    const { default: Navbar } = await import("@/components/layout/Navbar");
    const { container } = render(<Navbar />);

    // Just check that mobile menu button exists
    const menuButton = container.querySelector("button");
    expect(menuButton).toBeInTheDocument();
  });
});

describe("LoadingProvider Component", () => {
  test("should provide loading context", async () => {
    const { LoadingProvider, useLoading } = await import(
      "@/components/providers/LoadingProvider"
    );

    const TestComponent = () => {
      const { isLoading, startLoading, stopLoading } = useLoading();
      return (
        <div>
          <div data-testid="loading-state">
            {isLoading ? "Loading" : "Not Loading"}
          </div>
          <button onClick={startLoading}>Start</button>
          <button onClick={stopLoading}>Stop</button>
        </div>
      );
    };

    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "Not Loading"
    );

    fireEvent.click(screen.getByText("Start"));
    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("Loading");
    });

    fireEvent.click(screen.getByText("Stop"));
    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "Not Loading"
      );
    });
  });
});

describe("LinkLoadingInterceptor Component", () => {
  test("should render without errors", async () => {
    const { LinkLoadingInterceptor } = await import(
      "@/components/providers/LinkLoadingInterceptor"
    );
    const { LoadingProvider } = await import(
      "@/components/providers/LoadingProvider"
    );

    const { container } = render(
      <LoadingProvider>
        <LinkLoadingInterceptor />
      </LoadingProvider>
    );

    expect(container).toBeInTheDocument();
  });
});
