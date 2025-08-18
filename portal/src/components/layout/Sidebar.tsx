import { config } from "../../utils/config";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const menuItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-4-2-4 2V5z" />
        </svg>
      )
    },
    {
      id: 'subscriptions',
      label: 'Suscripciones',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'domains',
      label: 'Dominios',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M6.938 20h10.124c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 17.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100-8 4 4 0 000 8zm0 2c-3.866 0-7 3.134-7 7v1h14v-1c0-3.866-3.134-7-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="h-screen bg-white border-r border-gray-200 flex flex-col shadow-card w-64">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#c9f31d] rounded-2xl flex items-center justify-center shadow-card">
            <span className="text-gray-900 font-bold text-sm text-heading">D</span>
          </div>
          <div>
            <h1 className="text-gray-900 font-bold text-sm text-heading">The Dojo Lab</h1>
            <p className="text-gray-600 text-xs text-body">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 hover-lift text-caption ${
                  activeView === item.id
                    ? 'bg-gray-900 text-white shadow-card'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Version */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-gray-400 text-xs text-center text-body">v{config.appVersion}</p>
      </div>
    </aside>
  );
};