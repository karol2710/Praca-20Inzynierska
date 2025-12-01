import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <span>KubeChart</span>
          </Link>

          {/* Navigation Links */}
          {!isAuthPage && (
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className={`transition-colors ${
                  isActive("/")
                    ? "text-primary font-medium"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <Link
                to="/create-chart"
                className={`transition-colors ${
                  isActive("/create-chart")
                    ? "text-primary font-medium"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Create Chart
              </Link>
              <Link
                to="/deployments"
                className={`transition-colors ${
                  isActive("/deployments")
                    ? "text-primary font-medium"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Deployments
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-foreground">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
