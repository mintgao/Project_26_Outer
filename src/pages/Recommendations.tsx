import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Save, Info } from 'lucide-react';
import { getColorMatchScore, MatchResult, MATCH_STRATEGIES, MatchType, getSuggestedColors } from '../lib/colorMatching';

export default function Recommendations() {
  const { user } = useAuth();
  const [selectedStrategy, setSelectedStrategy] = useState<MatchType>('Monochromatic');
  const [generating, setGenerating] = useState(false);
  const [outfit, setOutfit] = useState<{ top: any; bottom: any; shoes: any } | null>(null);
  const [matchInfo, setMatchInfo] = useState<MatchResult | null>(null);
  const [message, setMessage] = useState('');

  const generateOutfit = async () => {
    if (!user) return;
    setGenerating(true);
    setOutfit(null);
    setMatchInfo(null);
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

      let bestPairs: { top: any, bottom: any, match: MatchResult }[] = [];

      // Find best top + bottom combinations that MATCH the selected strategy
      for (const top of tops) {
        for (const bottom of bottoms) {
          const match = getColorMatchScore(top.color, bottom.color);
          if (match.type === selectedStrategy) {
            bestPairs.push({ top, bottom, match });
          }
        }
      }

      // Sort by score descending just in case there are variations within a strategy
      bestPairs.sort((a, b) => b.match.score - a.match.score);

      if (bestPairs.length > 0) {
        // Pick a random pair from the matching ones to keep it fresh
        const bestPair = bestPairs[Math.floor(Math.random() * bestPairs.length)];
        const selectedTop = bestPair.top;
        const selectedBottom = bestPair.bottom;
        setMatchInfo(bestPair.match);

        // Try to match shoes
        let selectedShoes = null;
        if (shoes.length > 0) {
          const bestShoes = shoes.sort((a, b) => {
             const scoreA = getColorMatchScore(a.color, selectedBottom.color).score;
             const scoreB = getColorMatchScore(b.color, selectedBottom.color).score;
             return scoreB - scoreA;
          });
          selectedShoes = bestShoes[0];
        }

        setOutfit({
          top: selectedTop,
          bottom: selectedBottom,
          shoes: selectedShoes,
        });
      } else {
        // NO MATCH FOUND logic
        // Try to provide a helpful suggestion based on available tops
        const sampleTop = tops[Math.floor(Math.random() * tops.length)];
        const suggestedColors = getSuggestedColors(sampleTop.color, selectedStrategy);
        
        let suggestionMsg = `No ${selectedStrategy} matches found.`;
        if (suggestedColors.length > 0) {
          const colorList = suggestedColors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' or ');
          suggestionMsg += ` Try adding a ${colorList} bottom to match your ${sampleTop.color} top!`;
        } else {
          suggestionMsg += ` Try adding more colorful items to your wardrobe.`;
        }
        
        setMessage(suggestionMsg);
      }

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
          occasion: selectedStrategy, // Use strategy as occasion/tag for now
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
        
        {/* Strategy Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Style Strategy</label>
          <div className="grid grid-cols-1 gap-2">
            {MATCH_STRATEGIES.map((strategy) => (
              <button
                key={strategy.value}
                onClick={() => setSelectedStrategy(strategy.value)}
                className={`relative flex items-center p-3 border rounded-xl text-left transition-all ${
                  selectedStrategy === strategy.value
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${selectedStrategy === strategy.value ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {strategy.label}
                    </p>
                  </div>
                  <p className={`text-xs mt-0.5 ${selectedStrategy === strategy.value ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {strategy.description}
                  </p>
                </div>
                {selectedStrategy === strategy.value && (
                  <div className="ml-3 text-indigo-600">
                    <div className="w-4 h-4 rounded-full bg-indigo-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateOutfit}
          disabled={generating}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-4 text-sm font-bold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Scanning Wardrobe...' : `Find ${selectedStrategy} Match`}
        </button>

        {message && (
          <div className={`flex items-start p-4 rounded-lg ${message.includes('No') ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
            <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        {outfit && (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Match Info Banner */}
            {matchInfo && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm uppercase tracking-wider opacity-90">
                    {matchInfo.type}
                  </span>
                  <span className="font-black text-2xl">{matchInfo.score}%</span>
                </div>
                <p className="text-sm text-indigo-100 font-medium">{matchInfo.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top</span>
                   <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium capitalize border border-gray-200">{outfit.top.color}</span>
                </div>
                <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm border border-gray-100">
                  <img src={outfit.top.image_url} alt="Top" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bottom</span>
                   <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium capitalize border border-gray-200">{outfit.bottom.color}</span>
                </div>
                <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm border border-gray-100">
                  <img src={outfit.bottom.image_url} alt="Bottom" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            </div>
            
            {outfit.shoes && (
              <div className="w-2/3 mx-auto space-y-2 pt-2 group">
                <div className="flex justify-between items-center px-1">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shoes</span>
                   <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium capitalize border border-gray-200">{outfit.shoes.color}</span>
                </div>
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm border border-gray-100">
                  <img src={outfit.shoes.image_url} alt="Shoes" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            )}

            <button
              onClick={saveOutfit}
              className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Save className="w-5 h-5 mr-2" />
              Save to Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
