import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { UsersIcon, SaveIcon } from './icons';

interface PlayerManagementProps {
  players: Player[];
  isAdmin: boolean;
  onUpdatePlayerName: (playerId: number, newName: string) => void;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({ players, isAdmin, onUpdatePlayerName }) => {
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [currentName, setCurrentName] = useState('');

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const handleEditClick = (player: Player) => {
    setEditingPlayerId(player.id);
    setCurrentName(player.name);
  };

  const handleCancelClick = () => {
    setEditingPlayerId(null);
    setCurrentName('');
  };

  const handleSaveClick = () => {
    if (editingPlayerId && currentName.trim()) {
      onUpdatePlayerName(editingPlayerId, currentName.trim());
      setEditingPlayerId(null);
      setCurrentName('');
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentName(e.target.value);
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    } else if (e.key === 'Escape') {
      handleCancelClick();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 lg:p-6">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-3 flex items-center gap-3">
        <UsersIcon className="w-6 h-6" />
        Gerenciar Jogadores
      </h2>
      
      {!isAdmin && (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-sm rounded-lg p-4 text-center">
            <p>Apenas administradores podem editar os nomes dos jogadores.</p>
        </div>
      )}

      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        <ul className="divide-y divide-slate-700">
          {sortedPlayers.map(player => (
            <li key={player.id} className="p-3 flex justify-between items-center">
              {editingPlayerId === player.id ? (
                <div className="flex-grow flex items-center gap-2">
                  <input
                    type="text"
                    value={currentName}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    className="w-full bg-slate-900 border border-cyan-500 rounded-md py-1 px-2 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveClick}
                    className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-500 font-semibold transition"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={handleCancelClick}
                    className="px-3 py-1 rounded-md bg-slate-600 text-slate-200 hover:bg-slate-500 font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-slate-300">{player.name}</span>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEditClick(player)}
                      className="px-3 py-1 text-sm rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white font-semibold transition"
                    >
                      Editar
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};