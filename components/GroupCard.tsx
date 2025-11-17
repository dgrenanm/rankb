import React from 'react';
import { Group, Player, Match } from '../types';
import { TennisBallIcon } from './icons';

interface GroupCardProps {
  group: Group;
  players: Player[];
  matches: Match[];
  onMatchClick: (match: Match) => void;
  isAdmin: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, players, matches, onMatchClick, isAdmin }) => {
  const groupPlayers = players.filter(p => group.playerIds.includes(p.id));

  const getPlayerName = (id: number) => players.find(p => p.id === id)?.name || 'Desconhecido';

  const getMatchStatus = (match: Match) => {
    if (match.isNotPlayed) {
      return (
        <span className="text-xs font-mono px-2 py-1 rounded bg-slate-500 text-slate-200">
          Não Jogado
        </span>
      );
    }
    if (match.winnerId) {
      return (
        <span className="text-xs font-mono px-2 py-1 rounded bg-green-500 text-green-950">
          {match.score} {match.isWO && '(WO)'}
        </span>
      );
    }
    return (
      <span className="text-xs font-mono px-2 py-1 rounded bg-yellow-500/50 text-yellow-200">
        Pendente
      </span>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 transition-all hover:shadow-cyan-500/20 hover:scale-[1.02]">
      <h3 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">{group.name}</h3>
      <div className="mb-4">
        <h4 className="font-semibold text-slate-300 mb-2">Jogadores:</h4>
        <ul className="space-y-1">
          {groupPlayers.map(player => (
            <li key={player.id} className="text-slate-400 text-sm">{player.name}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-slate-300 mb-2">Jogos:</h4>
        <ul className="space-y-2">
          {matches.map(match => (
            <li 
              key={match.id} 
              onClick={() => isAdmin && onMatchClick(match)}
              className={`p-2 rounded-md bg-slate-700 transition ${isAdmin ? 'hover:bg-slate-600 cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <TennisBallIcon className="w-4 h-4 text-yellow-400" />
                  <span>
                    <span className={match.winnerId === match.player1Id ? 'font-bold text-white' : 'text-slate-400'}>
                      {getPlayerName(match.player1Id)}
                    </span>
                    <span className="text-slate-500 mx-1">vs</span>
                    <span className={match.winnerId === match.player2Id ? 'font-bold text-white' : 'text-slate-400'}>
                      {getPlayerName(match.player2Id)}
                    </span>
                  </span>
                </div>
                {getMatchStatus(match)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};