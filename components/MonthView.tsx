import React from 'react';
import { MonthlyData, Player, Match } from '../types';
import { GroupCard } from './GroupCard';

interface MonthViewProps {
  monthData: MonthlyData;
  players: Player[];
  onMatchClick: (match: Match) => void;
  isAdmin: boolean;
}

export const MonthView: React.FC<MonthViewProps> = ({ monthData, players, onMatchClick, isAdmin }) => {
  return (
    <div className="w-full h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {monthData.groups.map(group => {
            const groupMatches = monthData.matches.filter(match => {
                const groupPlayerIds = new Set(group.playerIds);
                return groupPlayerIds.has(match.player1Id) && groupPlayerIds.has(match.player2Id);
            });
            return (
                <GroupCard
                  key={group.id}
                  group={group}
                  players={players}
                  matches={groupMatches}
                  onMatchClick={onMatchClick}
                  isAdmin={isAdmin}
                />
            );
            })}
        </div>
    </div>
  );
};
