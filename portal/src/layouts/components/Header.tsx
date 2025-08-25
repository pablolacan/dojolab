// src/layouts/components/Header.tsx

import React from 'react';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../stores/auth-store';
import type { DirectusUser } from '../../lib/types/directus';

interface HeaderProps {
  user: DirectusUser | null;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const { logout } = useAuth();
  
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside user menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-zinc-400 hover:text-white"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Separator */}
      <div className="h-6 w-px bg-zinc-800 lg:hidden" />

      {/* Search */}
      <div className="flex flex-1 gap-x-4 lg:gap-x-6">
        <form className="relative flex flex-1 max-w-md" action="#" method="GET">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400 pl-3" />
            <Input
              className="pl-10 pr-4"
              placeholder="Buscar..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white relative"
        >
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
        </Button>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-zinc-800" />

        {/* Profile dropdown */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            className="flex items-center gap-x-2 text-sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={user.avatar}
                  alt={user.first_name || user.email}
                />
              ) : (
                <User className="h-4 w-4 text-zinc-400" />
              )}
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="text-sm font-semibold text-white" aria-hidden="true">
                {user?.first_name || user?.email || 'User'}
              </span>
            </span>
          </Button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-zinc-900 border border-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="p-1">
                {/* User info */}
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.first_name || 'User'
                    }
                  </p>
                  <p className="text-xs text-zinc-400">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="group flex w-full items-center px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};