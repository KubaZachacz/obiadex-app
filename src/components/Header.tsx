import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChefHat, LogOut, Utensils, Menu, X } from "lucide-react";
import { useMutation } from "@/lib/http/hooks";

interface HeaderProps {
  currentPath?: string;
  isAuthenticated: boolean;
}

/**
 * Header component with logo, responsive navigation, and logout.
 */
export function Header({ currentPath = "/", isAuthenticated }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { mutateAsync } = useMutation<unknown, undefined>("/api/auth/logout");

  const handleLogout = async () => {
    try {
      await mutateAsync(undefined);
      window.location.href = "/login";
    } catch {
      return;
    }
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Brand */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Obiadex</span>
          </a>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <>
              <nav className="hidden md:flex items-center gap-1">
                <Button variant={currentPath === "/" ? "default" : "ghost"} size="sm" asChild>
                  <a href="/" data-testid="nav-plan">
                    <Utensils className="h-4 w-4 mr-2" />
                    Plan
                  </a>
                </Button>

                <Button variant={currentPath === "/dishes" ? "default" : "ghost"} size="sm" asChild>
                  <a href="/dishes" data-testid="nav-dishes">
                    <ChefHat className="h-4 w-4 mr-2" />
                    Dania
                  </a>
                </Button>

                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="nav-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </Button>
              </nav>

              {/* Mobile Hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <nav className="md:hidden py-4 flex flex-col gap-2 border-t">
            <Button variant={currentPath === "/" ? "default" : "ghost"} size="sm" asChild className="justify-start">
              <a href="/" onClick={() => setMobileMenuOpen(false)} data-testid="nav-plan">
                <Utensils className="h-4 w-4 mr-2" />
                Plan
              </a>
            </Button>

            <Button
              variant={currentPath === "/dishes" ? "default" : "ghost"}
              size="sm"
              asChild
              className="justify-start"
            >
              <a href="/dishes" onClick={() => setMobileMenuOpen(false)} data-testid="nav-dishes">
                <ChefHat className="h-4 w-4 mr-2" />
                Dania
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="justify-start"
              data-testid="nav-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Wyloguj
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
