"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { MapPin, LogOut, Map, BookMarked, Menu, X, Info } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/75 backdrop-blur-xl border-b border-gray-200/70 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.12)]"
          : "bg-white border-b border-gray-200 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex justify-between items-center transition-all duration-300 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Link
            href="/"
            className="group flex items-center gap-2 font-extrabold text-xl tracking-tight"
          >
            <span className="relative inline-flex items-center justify-center">
              <span className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <MapPin className="relative w-6 h-6 text-blue-600 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]" />
            </span>
            <span className="text-gradient-static">Waypoint</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <NavLink href="/planner" active={isActive("/planner")}>
              <Map className="w-4 h-4" /> Planner
            </NavLink>
            {user && (
              <NavLink href="/trips" active={isActive("/trips")}>
                <BookMarked className="w-4 h-4" /> My Trips
              </NavLink>
            )}
            <NavLink href="/about" active={isActive("/about")}>
              <Info className="w-4 h-4" /> About
            </NavLink>

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <span className="text-sm text-gray-500 max-w-[160px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn-tap flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="link-underline text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-shine btn-tap relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-200 transition-all font-semibold text-sm"
                >
                  <span className="relative">Sign up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden btn-tap p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className="relative inline-block w-5 h-5">
              <Menu
                className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${
                  menuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`absolute inset-0 w-5 h-5 transition-all duration-200 ${
                  menuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          <MobileLink href="/planner" active={isActive("/planner")} onClick={() => setMenuOpen(false)}>
            <Map className="w-4 h-4" /> Planner
          </MobileLink>
          {user && (
            <MobileLink href="/trips" active={isActive("/trips")} onClick={() => setMenuOpen(false)}>
              <BookMarked className="w-4 h-4" /> My Trips
            </MobileLink>
          )}
          <MobileLink href="/about" active={isActive("/about")} onClick={() => setMenuOpen(false)}>
            <Info className="w-4 h-4" /> About
          </MobileLink>

          {user ? (
            <button
              onClick={() => {
                handleSignOut();
                setMenuOpen(false);
              }}
              className="btn-tap w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 font-medium hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/auth/login"
                className="btn-tap text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="btn-shine btn-tap bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-center font-semibold text-sm shadow-sm"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      data-active={active ? "true" : "false"}
      className={`link-underline flex items-center gap-1.5 transition-colors font-medium ${
        active ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
