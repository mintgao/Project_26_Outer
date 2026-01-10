import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Wrench, Trash2, Database, Loader2 } from 'lucide-react';

const ALLOWED_EMAILS = [
  'admin_outer_test@example.com',
  'mintgao@outlook.com'
];

const SEED_ITEMS = [
  // Tops
  { category: 'top', color: 'red', image_url: 'https://placehold.co/400x400/red/white?text=Red+Top' },
  { category: 'top', color: 'blue', image_url: 'https://placehold.co/400x400/blue/white?text=Blue+Top' },
  { category: 'top', color: 'white', image_url: 'https://placehold.co/400x400/white/black?text=White+Top' },
  { category: 'top', color: 'black', image_url: 'https://placehold.co/400x400/black/white?text=Black+Top' },
  
  // Bottoms
  { category: 'bottom', color: 'green', image_url: 'https://placehold.co/400x400/green/white?text=Green+Bottom' },
  { category: 'bottom', color: 'navy', image_url: 'https://placehold.co/400x400/000080/white?text=Navy+Bottom' },
  { category: 'bottom', color: 'black', image_url: 'https://placehold.co/400x400/black/white?text=Black+Bottom' },
  { category: 'bottom', color: 'beige', image_url: 'https://placehold.co/400x400/f5f5dc/black?text=Beige+Bottom' },

  // Shoes
  { category: 'shoes', color: 'white', image_url: 'https://placehold.co/400x400/white/black?text=White+Shoes' },
  { category: 'shoes', color: 'black', image_url: 'https://placehold.co/400x400/black/white?text=Black+Shoes' },
];

export default function DevTools() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user || !ALLOWED_EMAILS.includes(user.email || '')) return null;

  const clearWardrobe = async () => {
    if (!confirm('Are you sure you want to delete ALL items in your wardrobe?')) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('clothing')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      setMessage('Wardrobe cleared!');
      window.location.reload(); // Refresh to show changes
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedWardrobe = async () => {
    setLoading(true);
    setMessage('');
    try {
      const items = SEED_ITEMS.map(item => ({
        ...item,
        user_id: user.id,
        season: 'all',
        brand: 'Test Brand'
      }));

      const { error } = await supabase
        .from('clothing')
        .insert(items);

      if (error) throw error;
      setMessage('Test data seeded!');
      window.location.reload(); // Refresh to show changes
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110"
          title="Developer Tools"
        >
          <Wrench size={24} />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-4 w-64 border border-gray-200 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 flex items-center">
              <Wrench size={16} className="mr-2" />
              Dev Tools
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={seedWardrobe}
              disabled={loading}
              className="w-full flex items-center justify-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Database size={16} className="mr-2" />}
              Seed Test Data
            </button>

            <button
              onClick={clearWardrobe}
              disabled={loading}
              className="w-full flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              Clear Wardrobe
            </button>
          </div>

          {message && (
            <div className="mt-3 text-xs text-center p-2 bg-gray-50 rounded text-gray-600">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
