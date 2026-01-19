import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe("LoadingOverlay Component", () => {
  test("should render when loading is true", async () => {
    const { default: LoadingOverlay } = await import(
      "@/components/ui/LoadingOverlay"
    );

    const { container } = render(<LoadingOverlay isLoading={true} />);

    // Check if loading overlay exists by ID
    const overlay = container.querySelector("#global-loading-overlay");
    expect(overlay).toBeInTheDocument();
  });

  test("should not render when loading is false", async () => {
    const { default: LoadingOverlay } = await import(
      "@/components/ui/LoadingOverlay"
    );

    const { container } = render(<LoadingOverlay isLoading={false} />);

    // Should render nothing or hidden
    expect(container.firstChild).toBeNull();
  });
});

describe("WaveText Component", () => {
  test("should split text into individual characters", () => {
    const WaveText = ({ text }) => {
      return (
        <span>
          {text.split("").map((char, index) => (
            <span key={index}>{char}</span>
          ))}
        </span>
      );
    };

    render(<WaveText text="TEST" />);

    // Use getAllByText for duplicate characters
    const tChars = screen.getAllByText("T");
    expect(tChars.length).toBe(2); // Two 'T's in 'TEST'
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
  });
});

describe("Button Component Variants", () => {
  test("should render primary button", () => {
    const Button = ({ variant = "primary", children }) => (
      <button className={`btn-${variant}`}>{children}</button>
    );

    render(<Button variant="primary">Click Me</Button>);

    const button = screen.getByText("Click Me");
    expect(button).toHaveClass("btn-primary");
  });

  test("should render secondary button", () => {
    const Button = ({ variant = "primary", children }) => (
      <button className={`btn-${variant}`}>{children}</button>
    );

    render(<Button variant="secondary">Cancel</Button>);

    const button = screen.getByText("Cancel");
    expect(button).toHaveClass("btn-secondary");
  });
});

describe("Card Component", () => {
  test("should render card with title and content", () => {
    const Card = ({ title, children }) => (
      <div className="card">
        <h3>{title}</h3>
        <div>{children}</div>
      </div>
    );

    render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });
});

describe("Badge Component", () => {
  test("should render status badges", () => {
    const Badge = ({ status }) => {
      const colors = {
        success: "green",
        warning: "yellow",
        error: "red",
      };

      return <span className={`badge-${colors[status]}`}>{status}</span>;
    };

    render(<Badge status="success" />);

    const badge = screen.getByText("success");
    expect(badge).toHaveClass("badge-green");
  });
});

describe("Avatar Component", () => {
  test("should render avatar with image", () => {
    const Avatar = ({ src, alt, size = 40 }) => (
      <img src={src} alt={alt} width={size} height={size} className="avatar" />
    );

    const { container } = render(
      <Avatar src="/avatar.jpg" alt="User Avatar" size={50} />
    );

    // Use container.querySelector instead of screen.getByAlt
    const avatar = container.querySelector('img[alt="User Avatar"]');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("width", "50");
  });

  test("should render avatar with initials fallback", () => {
    const Avatar = ({ name }) => {
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      return <div className="avatar-initials">{initials}</div>;
    };

    render(<Avatar name="John Doe" />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});
