import React from 'react';
import { Player, BracketMatch } from '../types';
import { TrophyIcon } from './icons';

interface MatchCardProps {
    match: BracketMatch;
    getPlayerName: (id: number | null) => string;
    getPlayerRank: (id: number | null) => number;
    onClick: (match: BracketMatch) => void;
    isAdmin: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, getPlayerName, getPlayerRank, onClick, isAdmin }) => {
    const player1Name = getPlayerName(match.player1Id);
    const player2Name = getPlayerName(match.player2Id);
    const p1Rank = getPlayerRank(match.player1Id);
    const p2Rank = getPlayerRank(match.player2Id);

    const isClickable = isAdmin && match.player1Id !== null && match.player2Id !== null;

    const getPlayerClass = (playerId: number | null) => {
        if (!match.winnerId) return 'text-slate-300';
        return match.winnerId === playerId ? 'text-white font-bold' : 'text-slate-500';
    };

    return (
        <div 
            onClick={() => isClickable && onClick(match)}
            className={`bg-slate-700 rounded-md w-full shadow-md ${isClickable ? 'cursor-pointer hover:bg-slate-600 transition-colors' : 'cursor-default'}`}
        >
            <div className="p-2 border-b border-slate-600 flex justify-between items-center">
                <span className={`text-sm truncate ${getPlayerClass(match.player1Id)}`}>
                    {player1Name}
                </span>
                {p1Rank > 0 && (
                    <span className="text-xs font-bold bg-slate-800 text-cyan-400 rounded-full px-2 py-0.5 ml-2">{p1Rank}</span>
                )}
            </div>
            <div className="p-2 flex justify-between items-center">
                <span className={`text-sm truncate ${getPlayerClass(match.player2Id)}`}>
                    {player2Name}
                </span>
                 {p2Rank > 0 && (
                    <span className="text-xs font-bold bg-slate-800 text-cyan-400 rounded-full px-2 py-0.5 ml-2">{p2Rank}</span>
                )}
            </div>
             {match.score && (
                <div className="px-2 pb-1 text-center text-xs font-mono text-green-400">{match.score}</div>
             )}
        </div>
    );
};

interface RoundColumnProps {
    title: string;
    matches: BracketMatch[];
    getPlayerName: (id: number | null) => string;
    getPlayerRank: (id: number | null) => number;
    onMatchClick: (match: BracketMatch) => void;
    isAdmin: boolean;
}

const RoundColumn: React.FC<RoundColumnProps> = ({ title, matches, getPlayerName, getPlayerRank, onMatchClick, isAdmin }) => {
    return (
        <div className="flex flex-col items-center flex-shrink-0 w-56">
            <h3 className="text-lg font-bold text-slate-300 mb-4">{title}</h3>
            <div className="flex flex-col justify-around w-full h-full space-y-4">
                {matches.map(match => (
                    <MatchCard 
                        key={match.id}
                        match={match} 
                        getPlayerName={getPlayerName}
                        getPlayerRank={getPlayerRank}
                        onClick={onMatchClick}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    );
};

interface MasterBracketProps {
    players: Player[]; // All 40 players
    contenders: Player[]; // Top 16 players
    bracketData: BracketMatch[];
    onMatchClick: (match: BracketMatch) => void;
    isAdmin: boolean;
}

export const MasterBracket: React.FC<MasterBracketProps> = ({ players, contenders, bracketData, onMatchClick, isAdmin }) => {

    if (contenders.length < 16 || bracketData.length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 text-center">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Chave do Master</h2>
                <p className="text-slate-400">Aguardando a classificação de 16 jogadores para gerar a chave.</p>
            </div>
        );
    }
  
    const getPlayerName = (id: number | null) => {
        if (id === null) return 'A definir';
        return players.find(p => p.id === id)?.name || 'Desconhecido';
    };

    const getPlayerRank = (id: number | null) => {
        if (id === null) return 0;
        const rank = contenders.findIndex(p => p.id === id);
        return rank !== -1 ? rank + 1 : 0;
    };
    
    const rounds = {
        R16: bracketData.filter(m => m.round === 'R16').sort((a,b) => a.matchIndex - b.matchIndex),
        QF: bracketData.filter(m => m.round === 'QF').sort((a,b) => a.matchIndex - b.matchIndex),
        SF: bracketData.filter(m => m.round === 'SF').sort((a,b) => a.matchIndex - b.matchIndex),
        F: bracketData.filter(m => m.round === 'F'),
    };

    const finalMatch = rounds.F && rounds.F.length > 0 ? rounds.F[0] : null;
    const champion = finalMatch && finalMatch.winnerId ? players.find(p => p.id === finalMatch.winnerId) : null;

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 lg:p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2 border-b border-slate-700 pb-3 flex items-center gap-3">
                <TrophyIcon className="w-6 h-6" />
                Chave do Master
            </h2>
            
            {champion && (
                <div className="my-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-center">
                    <p className="text-sm text-yellow-400">Campeão do Master</p>
                    <p className="text-2xl font-bold text-yellow-300 animate-pulse">{champion.name}</p>
                </div>
            )}

            <div className="flex space-x-6 overflow-x-auto p-4 custom-scrollbar">
                <RoundColumn title="Oitavas" matches={rounds.R16} getPlayerName={getPlayerName} getPlayerRank={getPlayerRank} onMatchClick={onMatchClick} isAdmin={isAdmin} />
                <RoundColumn title="Quartas" matches={rounds.QF} getPlayerName={getPlayerName} getPlayerRank={getPlayerRank} onMatchClick={onMatchClick} isAdmin={isAdmin} />
                <RoundColumn title="Semifinal" matches={rounds.SF} getPlayerName={getPlayerName} getPlayerRank={getPlayerRank} onMatchClick={onMatchClick} isAdmin={isAdmin} />
                <RoundColumn title="Final" matches={rounds.F} getPlayerName={getPlayerName} getPlayerRank={getPlayerRank} onMatchClick={onMatchClick} isAdmin={isAdmin} />
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1e293b; /* slate-800 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #475569; /* slate-600 */
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b; /* slate-500 */
                }
            `}</style>
        </div>
    );
};