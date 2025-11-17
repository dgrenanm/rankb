import React, { useState, useEffect, useMemo } from 'react';
import { Match, Player, BracketMatch } from '../types';

type SetScore = [number, number];

// Helper to parse "6-4 7-5" into a structured object
const parseScoreToObject = (score: string): { set1: SetScore | null; set2: SetScore | null; set3: SetScore | null } => {
  const initialState = { set1: null, set2: null, set3: null };
  if (!score || score.includes('W.O.') || score.includes('Não Jogado')) return initialState;

  const parts = score.trim().split(' ');
  if (parts.length > 0 && parts[0]) {
    const set1Scores = parts[0].split('-').map(Number);
    if (set1Scores.length === 2 && !isNaN(set1Scores[0]) && !isNaN(set1Scores[1])) {
      initialState.set1 = [set1Scores[0], set1Scores[1]] as SetScore;
    }
  }
  if (parts.length > 1 && parts[1]) {
    const set2Scores = parts[1].split('-').map(Number);
    if (set2Scores.length === 2 && !isNaN(set2Scores[0]) && !isNaN(set2Scores[1])) {
      initialState.set2 = [set2Scores[0], set2Scores[1]] as SetScore;
    }
  }
  if (parts.length > 2 && parts[2]) {
    const set3Scores = parts[2].split('-').map(Number);
     if (set3Scores.length === 2 && !isNaN(set3Scores[0]) && !isNaN(set3Scores[1])) {
      initialState.set3 = [set3Scores[0], set3Scores[1]] as SetScore;
    }
  }
  return initialState;
};

// Helper to format the score object back to a string
const formatScoreToString = (scores: { set1: SetScore | null; set2: SetScore | null; set3: SetScore | null }): string => {
  const parts = [];
  if (scores.set1) parts.push(scores.set1.join('-'));
  if (scores.set2) parts.push(scores.set2.join('-'));
  if (scores.set3) parts.push(scores.set3.join('-'));
  return parts.join(' ');
};

interface ScorePickerProps {
    title: string;
    maxScore: number;
    score: SetScore | null;
    player1Name: string;
    player2Name: string;
    onScoreChange: (newScore: SetScore) => void;
}

const ScorePicker: React.FC<ScorePickerProps> = ({ title, maxScore, score, player1Name, player2Name, onScoreChange }) => {
    const p1Score = score ? score[0] : -1;
    const p2Score = score ? score[1] : -1;

    const handleSelect = (playerIndex: number, value: number) => {
        const newScore: SetScore = score ? [score[0], score[1]] : [0, 0];
        newScore[playerIndex] = value;
        onScoreChange(newScore);
    };
    
    const isSuperTiebreak = maxScore > 7;
    const gridCols = isSuperTiebreak ? 'grid-cols-5' : 'grid-cols-4';

    return (
        <div>
            <h4 className="text-md font-semibold text-slate-300 mb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-slate-400 mb-2">{player1Name}</p>
                    <div className={`grid ${gridCols} gap-2`}>
                        {Array.from({ length: maxScore + 1 }).map((_, i) => (
                            <button key={i} onClick={() => handleSelect(0, i)} className={`p-2 rounded text-center text-sm transition ${p1Score === i ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{i}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-sm text-slate-400 mb-2">{player2Name}</p>
                     <div className={`grid ${gridCols} gap-2`}>
                        {Array.from({ length: maxScore + 1 }).map((_, i) => (
                            <button key={i} onClick={() => handleSelect(1, i)} className={`p-2 rounded text-center text-sm transition ${p2Score === i ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-600 hover:bg-slate-500'}`}>{i}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface MatchResultModalProps {
  match: (Omit<Match, 'player1Id' | 'player2Id'> | Omit<BracketMatch, 'player1Id' | 'player2Id'>) & { player1Id: number; player2Id: number; winnerId: number | null; };
  player1: Player;
  player2: Player;
  onClose: () => void;
  onSave: (match: Match | BracketMatch, newWinnerId: number, newScore: string, newIsWO: boolean) => void;
  onReset: () => void;
  onSetNotPlayed: () => void;
  isBracketMatch?: boolean;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({ match, player1, player2, onClose, onSave, onReset, onSetNotPlayed, isBracketMatch = false }) => {
  const [winnerId, setWinnerId] = useState<number | null>(match.winnerId);
  const [isWO, setIsWO] = useState('isWO' in match ? match.isWO : false);
  const [scores, setScores] = useState(parseScoreToObject(match.score));

  const isNotPlayed = 'isNotPlayed' in match ? match.isNotPlayed : false;

  useEffect(() => {
    setWinnerId(match.winnerId);
    setScores(parseScoreToObject(match.score));
    setIsWO('isWO' in match ? match.isWO : false);
  }, [match]);

  const { p1SetsWon, p2SetsWon } = useMemo(() => {
    let p1Won = 0;
    let p2Won = 0;
    if (scores.set1) {
        if (scores.set1[0] > scores.set1[1]) p1Won++;
        else if (scores.set1[1] > scores.set1[0]) p2Won++;
    }
    if (scores.set2) {
        if (scores.set2[0] > scores.set2[1]) p1Won++;
        else if (scores.set2[1] > scores.set2[0]) p2Won++;
    }
    if (scores.set3) {
        if (scores.set3[0] > scores.set3[1]) p1Won++;
        else if (scores.set3[1] > scores.set3[0]) p2Won++;
    }
    return { p1SetsWon: p1Won, p2SetsWon: p2Won };
  }, [scores]);
  
  const isThirdSetRequired = useMemo(() => {
    if (!scores.set1 || !scores.set2) return false;

    let p1FirstTwoSets = 0;
    let p2FirstTwoSets = 0;

    if (scores.set1[0] > scores.set1[1]) p1FirstTwoSets++;
    else if (scores.set1[1] > scores.set1[0]) p2FirstTwoSets++;
    
    if (scores.set2[0] > scores.set2[1]) p1FirstTwoSets++;
    else if (scores.set2[1] > scores.set2[0]) p2FirstTwoSets++;
    
    return p1FirstTwoSets === 1 && p2FirstTwoSets === 1;
  }, [scores.set1, scores.set2]);


  useEffect(() => {
    if (isWO || isNotPlayed) {
        // In W.O. mode, winner is set manually. In "not played" mode, winner is null.
        return;
    }
    // Automatically determine winner based on total sets won
    if (p1SetsWon > p2SetsWon) {
        setWinnerId(player1.id);
    } else if (p2SetsWon > p1SetsWon) {
        setWinnerId(player2.id);
    } else {
        setWinnerId(null); // No winner yet if sets are tied
    }
  }, [p1SetsWon, p2SetsWon, isWO, isNotPlayed, player1.id, player2.id]);

  const handleScoreChange = (set: 'set1' | 'set2' | 'set3', newScore: SetScore) => {
    setScores(prev => ({ ...prev, [set]: newScore }));
  };
  
  const handleSave = () => {
    if (!winnerId) {
        alert("Por favor, defina um vencedor ou preencha o placar corretamente.");
        return;
    }
    
    const finalScore = isWO ? "6-0 6-0" : formatScoreToString(scores);
    onSave(match, winnerId, finalScore, isWO);
  };
  
  const handleReset = () => {
    onReset();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-xl font-bold text-cyan-400">{player1.name}</h3>
                <span className="text-slate-500 font-bold mx-2">vs</span>
                <h3 className="text-xl font-bold text-cyan-400">{player2.name}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
          </div>
          
          <div className="border-t border-slate-700 pt-4">
            {isNotPlayed ? (
                 <div className="text-center p-8 bg-slate-700/50 rounded-lg">
                    <p className="text-lg font-semibold text-slate-300">Este jogo foi marcado como "Não Jogado".</p>
                    <p className="text-sm text-slate-400">Nenhum ponto foi atribuído. Você pode resetar este status para inserir um resultado.</p>
                </div>
            ) : (
             <>
                {!isBracketMatch && (
                  <div className="flex items-center justify-end mb-4">
                      <span className="mr-3 text-sm font-medium text-slate-300">Marcar como W.O.</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={isWO} onChange={() => setIsWO(!isWO)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                  </div>
                )}
                
                {isWO && !isBracketMatch ? (
                    <div>
                        <h4 className="text-md font-semibold text-slate-300 mb-2">Selecione o Vencedor</h4>
                        <div className="flex flex-col space-y-2">
                            <label className={`p-3 rounded-md cursor-pointer transition ${winnerId === player1.id ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                <input type="radio" name="winner" value={player1.id} checked={winnerId === player1.id} onChange={() => setWinnerId(player1.id)} className="sr-only" />
                                {player1.name}
                            </label>
                            <label className={`p-3 rounded-md cursor-pointer transition ${winnerId === player2.id ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                <input type="radio" name="winner" value={player2.id} checked={winnerId === player2.id} onChange={() => setWinnerId(player2.id)} className="sr-only" />
                                {player2.name}
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <ScorePicker title="1º Set" maxScore={7} score={scores.set1} player1Name={player1.name} player2Name={player2.name} onScoreChange={(s) => handleScoreChange('set1', s)} />
                        <ScorePicker title="2º Set" maxScore={7} score={scores.set2} player1Name={player1.name} player2Name={player2.name} onScoreChange={(s) => handleScoreChange('set2', s)} />
                        {isThirdSetRequired && (
                            <ScorePicker title="Super Tie-break (3º Set)" maxScore={20} score={scores.set3} player1Name={player1.name} player2Name={player2.name} onScoreChange={(s) => handleScoreChange('set3', s)} />
                        )}
                    </div>
                )}
             </>
            )}
          </div>
        </div>
        <div className="bg-slate-900/50 px-6 py-4 flex justify-between items-center rounded-b-lg">
            <div className="flex items-center space-x-2">
              {(match.winnerId || isNotPlayed) && (
                <button 
                    onClick={handleReset} 
                    className="px-4 py-2 rounded-md bg-red-800 text-red-100 hover:bg-red-700 font-semibold transition"
                >
                    Resetar Resultado
                </button>
              )}
               {!isBracketMatch && !match.winnerId && !isNotPlayed && (
                <button
                    onClick={onSetNotPlayed}
                    className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-500 font-semibold transition"
                >
                    Marcar como Não Jogado
                </button>
              )}
            </div>
            <div className="flex space-x-3">
                <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 text-slate-200 hover:bg-slate-500 font-semibold transition">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 font-semibold transition disabled:bg-slate-500 disabled:cursor-not-allowed" disabled={!winnerId || isNotPlayed}>Salvar Resultado</button>
            </div>
        </div>
      </div>
    </div>
  );
};