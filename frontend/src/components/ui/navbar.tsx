import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/auth";
import { isMobile } from "react-device-detect";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Map", href: "/map" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const Navbar = () => {
  const location = useLocation();

  if (isMobile) {
    return <MobileNavbar />;
  }

  return (
    <Disclosure
      as="nav"
      className="relative bg-gray-800/50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-open:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-open:block"
              />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <Link to="/">
                <img
                  alt="Open Pothole Map"
                  src="/logo.png"
                  className="h-8 w-auto cursor-pointer"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => {
                  const isCurrentPage = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={isCurrentPage ? "page" : undefined}
                      className={classNames(
                        isCurrentPage
                          ? "bg-gray-950/50 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )}>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-right inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => {
            const isCurrentPage = location.pathname === item.href;
            return (
              <DisclosureButton
                key={item.name}
                as={Link}
                to={item.href}
                aria-current={isCurrentPage ? "page" : undefined}
                className={classNames(
                  isCurrentPage
                    ? "bg-gray-950/50 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white",
                  "block rounded-md px-3 py-2 text-base font-medium"
                )}>
                {item.name}
              </DisclosureButton>
            );
          })}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
};

const MobileNavbar = () => {
  const location = useLocation();

  return (
    <Disclosure
      as="nav"
      className="fixed w-full bg-transparent after:pointer-events-none after:absolute after:inset-x-0 z-10">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-1 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-full p-1 text-gray-400 bg-white hover:text-white outline-2 outline-offset-2 outline-solid outline-[var(--primary)]">
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-open:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-open:block"
              />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start ml-4 pr-8">
            {/* Navigation items */}
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => {
                  const isCurrentPage = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={isCurrentPage ? "page" : undefined}
                      className={classNames(
                        isCurrentPage
                          ? "bg-gray-950/50 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )}>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-right inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden flex flex-col items-start ml-2 space-y-2">
        {navigation.map((item) => {
          const isCurrentPage = location.pathname === item.href;
          return (
            <DisclosureButton
              key={item.name}
              as={Link}
              to={item.href}
              aria-current={isCurrentPage ? "page" : undefined}
              className={classNames(
                isCurrentPage
                  ? "shadow-lg rounded-xl bg-primary text-primary-foreground px-5 py-2 text-base font-medium"
                  : "shadow-lg rounded-xl bg-foreground text-background px-5 py-2 text-base font-medium",
                "inline-flex w-auto"
              )}>
              {item.name}
            </DisclosureButton>
          );
        })}
      </DisclosurePanel>
    </Disclosure>
  );
};

const ProfileDropdown = () => {
  const { user, logoutMutation } = useAuth();

  const handleLogout = async () => {
    await logoutMutation.mutate();
    window.location.href = "/login";
  };

  return (
    <Menu as="div" className="relative ml-3">
      <MenuButton className="relative flex">
        <span className="absolute -inset-1.5" />
        <span className="sr-only">Open user menu</span>
        {user?.avatarUrl ? (
          <img
            alt="avatar"
            src={`${user.avatarUrl}`}
            className="size-8 rounded-full bg-gray-800 outline-2 outline-offset-2 outline-solid outline-[var(--primary)]"
          />
        ) : (
          <img
            alt="avatar"
            src="/anonymous_user.jpg"
            className="size-8 rounded-full bg-gray-800 outline-2 outline-offset-2 outline-solid outline-[var(--primary)]"
          />
        )}
      </MenuButton>

      <MenuItems
        transition
        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in">
        {user ? (
          <>
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden">
                Your profile
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden">
                Settings
              </a>
            </MenuItem>

            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden"
                onClick={handleLogout}>
                Log Out
              </a>
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem>
              <Link
                to="/login"
                className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden">
                Log In
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                to="/signup"
                className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden">
                Sign Up
              </Link>
            </MenuItem>
          </>
        )}
      </MenuItems>
    </Menu>
  );
};
