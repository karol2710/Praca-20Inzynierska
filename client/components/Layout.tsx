import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Menu, X } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
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
            <div className="hidden md:flex items-center gap-6">
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

              {/* Only show to authenticated users */}
              {isAuthenticated && (
                <>
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
                </>
              )}

              {/* Auth Actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-4 pl-6 border-l border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    <span className="text-foreground/80">{user?.username}</span>
                  </div>
                  <Link to="/account" className="btn-ghost text-foreground text-sm">
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost text-foreground text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-foreground">
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {!isAuthPage && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          )}
        </nav>

        {/* Mobile Menu */}
        {!isAuthPage && mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/50">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                to="/"
                className="block text-foreground/70 hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/create-chart"
                    className="block text-foreground/70 hover:text-foreground py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Chart
                  </Link>
                  <Link
                    to="/deployments"
                    className="block text-foreground/70 hover:text-foreground py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Deployments
                  </Link>
                </>
              )}

              <div className="border-t border-border pt-3">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-foreground/80 mb-3">
                      <User className="w-4 h-4" />
                      {user?.username}
                    </div>
                    <Link
                      to="/account"
                      className="block text-foreground/70 hover:text-foreground py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-foreground/70 hover:text-foreground py-2 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block text-foreground/70 hover:text-foreground py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="block text-primary font-semibold py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-foreground/70">
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <a
                href="https://github.com/karol2710/Praca-20Magisterska"
                className="text-primary hover:underline"
              >
                Praca Inżynierska KŻ
              </a>
              <span>© 2025 by</span>
              <a
                href="https://github.com/karol2710"
                className="text-primary hover:underline"
              >
                Karol Żachowski
              </a>
              <span>is licensed under</span>
              <a
                href="https://creativecommons.org/licenses/by-nc/4.0/"
                className="text-primary hover:underline"
              >
                CC BY-NC 4.0
              </a>
            </div>
            <div className="flex items-center gap-1 justify-center">
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
                alt="Creative Commons"
                style={{ maxWidth: "1em", maxHeight: "1em" }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/by.svg"
                alt="Attribution"
                style={{
                  maxWidth: "1em",
                  maxHeight: "1em",
                  marginLeft: "0.2em",
                }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/nc.svg"
                alt="Non-Commercial"
                style={{
                  maxWidth: "1em",
                  maxHeight: "1em",
                  marginLeft: "0.2em",
                }}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
