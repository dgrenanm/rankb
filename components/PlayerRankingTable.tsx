import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { TrophyIcon, SearchIcon } from './icons';

interface PlayerRankingTableProps {
  players: Player[];
}

export const PlayerRankingTable: React.FC<PlayerRankingTableProps> = ({ players }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMonthly, setShowMonthly] = useState(false);

  const originalSortedPlayers = useMemo(() => [...players].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.name.localeCompare(b.name); // Alphabetical tie-breaker
    }), [players]);

  const filteredPlayers = useMemo(() => {
    return originalSortedPlayers.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [originalSortedPlayers, searchTerm]);
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-yellow-600';
    return 'text-slate-400';
  };

  const getOriginalRank = (playerId: number) => {
      return originalSortedPlayers.findIndex(p => p.id === playerId) + 1;
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 lg:p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
          <TrophyIcon className="w-6 h-6 mr-2"/>
          Ranking
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium transition-colors ${!showMonthly ? 'text-white' : 'text-slate-400'}`}>Geral</span>
          <label htmlFor="stats-toggle" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="stats-toggle" className="sr-only peer" checked={showMonthly} onChange={() => setShowMonthly(!showMonthly)} />
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
          aria-label="Buscar jogador no ranking"
        />
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[480px]">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr>
                <th className="p-2 font-semibold text-slate-400">#</th>
                <th className="p-2 font-semibold text-slate-400">Jogador</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Jogos Disputados">J</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Vitórias">V</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Derrotas">D</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Sets Ganhos">SG</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Pontos por Jogo">PJ</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title={showMonthly ? "Pontos (Mês)" : "Pontos (Geral)"}>Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPlayers.map((player) => {
                const rank = getOriginalRank(player.id);
                
                const classNames = ['hover:bg-slate-700/50', 'transition-colors'];

                if (!showMonthly) {
                    // Highlight top 16 for the Master tournament
                    if (rank <= 16) {
                        classNames.push('border-l-4', 'border-cyan-500');
                    }
                    
                    // Apply background colors for each group of 4 players based on a repeating pattern
                    const groupIndex = Math.floor((rank - 1) / 4);
                    const colorIndex = groupIndex % 3;
                    
                    switch (colorIndex) {
                        case 0:
                            classNames.push('bg-green-600/20');
                            break;
                        case 1:
                            classNames.push('bg-yellow-500/20');
                            break;
                        case 2:
                            classNames.push('bg-blue-600/20');
                            break;
                    }
                }
                
                return (
                    <tr key={player.id} className={classNames.join(' ')}>
                    <td className={`p-2 text-center font-bold ${getRankColor(rank)}`}>{rank}</td>
                    <td className="p-2 text-slate-300 font-medium whitespace-nowrap">{player.name}</td>
                    <td className="p-2 text-center font-mono text-slate-400">{showMonthly ? player.monthlyGamesPlayed : player.gamesPlayed}</td>
                    <td className="p-2 text-center font-mono text-green-400">{showMonthly ? player.monthlyWins : player.wins}</td>
                    <td className="p-2 text-center font-mono text-red-400">{showMonthly ? player.monthlyLosses : player.losses}</td>
                    <td className="p-2 text-center font-mono text-slate-400">{showMonthly ? player.monthlySetsWon : player.setsWon}</td>
                    <td className="p-2 text-center font-mono text-slate-400">{showMonthly ? player.monthlyPointsFromGames : player.pointsFromGames}</td>
                    <td className="p-2 text-center font-bold font-mono text-cyan-400">{showMonthly ? player.monthlyPoints : player.totalPoints}</td>
                    </tr>
                );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};