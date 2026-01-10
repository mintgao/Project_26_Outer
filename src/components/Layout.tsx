import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shirt, User, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DevTools from './DevTools';

export default function Layout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: '/', icon: Shirt, label: 'Wardrobe' },
    { path: '/recommendations', icon: Sparkles, label: 'Ideas' },
    { path: '/body-profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="bg-white px-4 py-3 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">Outer</h1>
        <button onClick={() => signOut()} className="text-gray-500 hover:text-gray-700">
          <LogOut size={20} />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      <DevTools />

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white pb-4">
        <div className="flex justify-around p-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center p-2 ${
                pathname === path ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
