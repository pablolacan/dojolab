import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  title: string;
}

export const Layout = ({ children, activeView, onViewChange, title }: LayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          activeView={activeView} 
          onViewChange={onViewChange}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative w-64">
            <Sidebar 
              activeView={activeView} 
              onViewChange={(view) => {
                onViewChange(view);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar 
          title={title}
          onToggleSidebar={toggleMobileSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};