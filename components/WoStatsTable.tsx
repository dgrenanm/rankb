import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { UserSlashIcon, SearchIcon } from './icons';

interface WoStatsTableProps {
  players: Player[];
}

export const WoStatsTable: React.FC<WoStatsTableProps> = ({ players }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMonthly, setShowMonthly] = useState(false);

  const sortedPlayers = useMemo(() => {
    // Sort by most WO wins, then least WO losses, then alphabetically
    const sorter = (a: Player, b: Player) => {
        const aWins = showMonthly ? a.monthlyWoWins : a.totalWoWins;
        const bWins = showMonthly ? b.monthlyWoWins : b.totalWoWins;
        if (aWins !== bWins) return bWins - aWins;
        
        const aLosses = showMonthly ? a.monthlyWoLosses : a.totalWoLosses;
        const bLosses = showMonthly ? b.monthlyWoLosses : b.totalWoLosses;
        if (aLosses !== bLosses) return aLosses - bLosses;

        return a.name.localeCompare(b.name);
    }
    return [...players].sort(sorter);
  }, [players, showMonthly]);


  const filteredPlayers = useMemo(() => {
    if (!searchTerm) {
        return sortedPlayers.filter(p => {
            const wins = showMonthly ? p.monthlyWoWins : p.totalWoWins;
            const losses = showMonthly ? p.monthlyWoLosses : p.totalWoLosses;
            return wins > 0 || losses > 0;
        });
    }
    return sortedPlayers.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedPlayers, searchTerm, showMonthly]);
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 lg:p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
          <UserSlashIcon className="w-6 h-6 mr-2"/>
          Estatísticas de W.O.
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium transition-colors ${!showMonthly ? 'text-white' : 'text-slate-400'}`}>Geral</span>
          <label htmlFor="stats-toggle-wo" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="stats-toggle-wo" className="sr-only peer" checked={showMonthly} onChange={() => setShowMonthly(!showMonthly)} />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
          </label>
          <span className={`text-sm font-medium transition-colors ${showMonthly ? 'text-white' : 'text-slate-400'}`}>Mês</span>
        </div>
      </div>
       <div className="mb-4 relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar jogador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
          aria-label="Buscar jogador nas estatísticas de W.O."
        />
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr>
                <th className="p-2 font-semibold text-slate-400">#</th>
                <th className="p-2 font-semibold text-slate-400">Jogador</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Vitórias por W.O.">Vitórias por W.O.</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Derrotas por W.O.">Derrotas por W.O.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPlayers.length > 0 ? filteredPlayers.map((player, index) => (
                    <tr key={player.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="p-2 text-slate-300 font-medium whitespace-nowrap">{player.name}</td>
                      <td className="p-2 text-center font-mono text-green-400">{showMonthly ? player.monthlyWoWins : player.totalWoWins}</td>
                      <td className="p-2 text-center font-mono text-red-400">{showMonthly ? player.monthlyWoLosses : player.totalWoLosses}</td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                            Nenhum W.O. registrado {showMonthly ? 'este mês' : 'ainda'}.
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};