// src/layouts/components/Sidebar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  CreditCard, 
  Server, 
  Globe, 
  FileText, 
  Building, 
  X 
} from 'lucide-react';
import { cn } from '../../components/lib/utils';
import { Button } from '../../components/ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Servicios', href: '/services', icon: Server },
  { name: 'Dominios', href: '/domains', icon: Globe },
  { name: 'Facturas', href: '/invoices', icon: FileText },
  { name: 'Suscripciones', href: '/subscriptions', icon: CreditCard },
  { name: 'Proveedores', href: '/providers', icon: Building },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6 pb-4 border-r border-zinc-800">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/logo.png"
              alt="DojoLab"
            />
            <span className="ml-3 text-xl font-bold font-heading text-white">
              DojoLab
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200",
                            isActive
                              ? "bg-lime-300 text-zinc-900"
                              : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                          )
                        }
                      >
                        <item.icon
                          className="h-5 w-5 shrink-0 transition-colors"
                          aria-hidden="true"
                        />
                        {item.name}
                        {item.count && (
                          <span className="ml-auto w-6 h-6 text-xs bg-zinc-700 text-zinc-300 rounded-full flex items-center justify-center">
                            {item.count}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="mt-auto pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-500">
              DojoLab Portal v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <div className="relative z-50 lg:hidden">
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative flex w-full max-w-xs flex-col bg-zinc-900 pb-4 border-r border-zinc-800"
            >
              {/* Close button */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <div className="flex items-center">
                  <img
                    className="h-8 w-auto"
                    src="/logo.png"
                    alt="DojoLab"
                  />
                  <span className="ml-3 text-xl font-bold font-heading text-white">
                    DojoLab
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex flex-1 flex-col px-6">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200",
                                isActive
                                  ? "bg-lime-300 text-zinc-900"
                                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                              )
                            }
                          >
                            <item.icon
                              className="h-5 w-5 shrink-0 transition-colors"
                              aria-hidden="true"
                            />
                            {item.name}
                            {item.count && (
                              <span className="ml-auto w-6 h-6 text-xs bg-zinc-700 text-zinc-300 rounded-full flex items-center justify-center">
                                {item.count}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>

              {/* Bottom section */}
              <div className="px-6 mt-auto pt-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500">
                  DojoLab Portal v1.0
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};