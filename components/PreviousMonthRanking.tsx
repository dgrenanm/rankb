import React, { useState, useMemo } from 'react';
import { SEPTEMBER_RANKING, OCTOBER_RANKING } from '../utils/historicalData';
import { CalendarIcon } from './icons';

type RankingEntry = {
  name: string;
  games: number;
  wins: number;
  losses: number;
  sets: number;
  gamePoints: number;
  total: number;
};

export const PreviousMonthRanking: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<'october' | 'september'>('october');

  const rankingData: RankingEntry[] = useMemo(() => {
    return selectedMonth === 'october' ? OCTOBER_RANKING : SEPTEMBER_RANKING;
  }, [selectedMonth]);

  const monthName = useMemo(() => {
    return selectedMonth === 'october' ? 'Outubro' : 'Setembro';
  }, [selectedMonth]);

  const getRowColor = (rank: number) => {
    const groupIndex = Math.floor((rank - 1) / 4);
    const colorIndex = groupIndex % 3;
    
    switch (colorIndex) {
      case 0:
        return 'bg-green-600/20'; // Green
      case 1:
        return 'bg-yellow-500/20'; // Yellow
      case 2:
        return 'bg-blue-600/20'; // Blue
      default:
        return '';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-700 pb-3">
        <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3 mb-3 sm:mb-0">
          <CalendarIcon className="w-6 h-6" />
          Classificação Final - {monthName}
        </h2>
        <div className="flex items-center space-x-2 bg-slate-700 p-1 rounded-lg">
           <button 
             onClick={() => setSelectedMonth('october')}
             className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${selectedMonth === 'october' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
           >
             Outubro
           </button>
           <button 
             onClick={() => setSelectedMonth('september')}
             className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${selectedMonth === 'september' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
           >
             Setembro
           </button>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[480px]">
            <thead className="sticky top-0 bg-slate-800 z-10">
                <tr>
                <th className="p-2 font-semibold text-slate-400 text-center">#</th>
                <th className="p-2 font-semibold text-slate-400">Jogador</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Jogos Disputados">J</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Vitórias">V</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Derrotas">D</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Sets Ganhos">SG</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Pontos por Jogo">PJ</th>
                <th className="p-2 font-semibold text-slate-400 text-center" title="Total">Pts</th>
                </tr>
            </thead>
            <tbody>
                {rankingData.map((player, index) => {
                const rank = index + 1;
                return (
                    <tr key={player.name} className={`transition-colors ${getRowColor(rank)}`}>
                    <td className={`p-2 text-center font-bold text-slate-300`}>{rank}</td>
                    <td className="p-2 text-slate-300 font-medium whitespace-nowrap">{player.name}</td>
                    <td className="p-2 text-center font-mono text-slate-400">{player.games}</td>
                    <td className="p-2 text-center font-mono text-green-400">{player.wins}</td>
                    <td className="p-2 text-center font-mono text-red-400">{player.losses}</td>
                    <td className="p-2 text-center font-mono text-slate-400">{player.sets}</td>
                    <td className="p-2 text-center font-mono text-slate-400">{player.gamePoints}</td>
                    <td className="p-2 text-center font-bold font-mono text-cyan-400">{player.total}</td>
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