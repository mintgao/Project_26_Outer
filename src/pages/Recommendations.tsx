import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Save } from 'lucide-react';

export default function Recommendations() {
  const { user } = useAuth();
  const [occasion, setOccasion] = useState('casual');
  const [generating, setGenerating] = useState(false);
  const [outfit, setOutfit] = useState<{ top: any; bottom: any; shoes: any } | null>(null);
  const [message, setMessage] = useState('');

  const generateOutfit = async () => {
    if (!user) return;
    setGenerating(true);
    setOutfit(null);
    setMessage('');

    try {
      // Fetch all clothing items
      const { data: items, error } = await supabase
        .from('clothing')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!items || items.length === 0) {
        setMessage("You don't have enough clothes in your wardrobe yet!");
        return;
      }

      const tops = items.filter(i => i.category === 'top');
      const bottoms = items.filter(i => i.category === 'bottom');
      const shoes = items.filter(i => i.category === 'shoes');

      if (tops.length === 0 || bottoms.length === 0) {
        setMessage("You need at least one top and one bottom to generate an outfit.");
        return;
      }

      // Simple Random Selection
      const randomTop = tops[Math.floor(Math.random() * tops.length)];
      const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      const randomShoes = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;

      setOutfit({
        top: randomTop,
        bottom: randomBottom,
        shoes: randomShoes,
      });

    } catch (error: any) {
      console.error('Error generating outfit:', error);
      setMessage('Error generating outfit. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const saveOutfit = async () => {
    if (!user || !outfit) return;
    try {
      // Create outfit record
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          occasion,
        })
        .select()
        .single();

      if (outfitError) throw outfitError;

      // Create outfit items links
      const itemsToLink = [outfit.top.id, outfit.bottom.id];
      if (outfit.shoes) itemsToLink.push(outfit.shoes.id);

      const outfitItems = itemsToLink.map(itemId => ({
        outfit_id: outfitData.id,
        clothing_id: itemId
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      setMessage('Outfit saved to your history!');
    } catch (error: any) {
      setMessage(`Error saving: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Get Inspired</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Occasion</label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white border"
          >
            <option value="casual">Casual</option>
            <option value="work">Work</option>
            <option value="date">Date Night</option>
            <option value="party">Party</option>
          </select>
        </div>

        <button
          onClick={generateOutfit}
          disabled={generating}
          className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Mixing & Matching...' : 'Generate Outfit'}
        </button>

        {message && (
          <div className="text-center text-sm text-gray-600 bg-gray-100 p-2 rounded-md">
            {message}
          </div>
        )}

        {outfit && (
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Top</span>
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                  <img src={outfit.top.image_url} alt="Top" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Bottom</span>
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                  <img src={outfit.bottom.image_url} alt="Bottom" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
            
            {outfit.shoes && (
              <div className="w-1/2 mx-auto space-y-2">
                <span className="text-xs font-medium text-gray-500 uppercase text-center block">Shoes</span>
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                  <img src={outfit.shoes.image_url} alt="Shoes" className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            <button
              onClick={saveOutfit}
              className="flex w-full items-center justify-center rounded-md border border-indigo-600 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
            >
              <Save className="mr-2 h-4 w-4" />
              Save this Look
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
