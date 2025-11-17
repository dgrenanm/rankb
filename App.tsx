import React, { useState, useMemo, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Player, Match, MonthlyData, Group, BracketMatch, AppState } from './types';
import { PlayerRankingTable } from './components/PlayerRankingTable';
import { MonthView } from './components/MonthView';
import { MasterBracket } from './components/MasterBracket';
import { PreviousMonthRanking } from './components/PreviousMonthRanking';
import { MatchResultModal } from './components/MatchResultModal';
import { WoStatsTable } from './components/WoStatsTable';
import { PlayerManagement } from './components/PlayerManagement';
import { LoginModal } from './components/Login';
import { parseScore, generateMasterBracket, sanitizeState } from './utils/helpers';
import { initialData } from './data';
import { TrophyIcon, TournamentIcon, CalendarIcon, UserSlashIcon, UsersIcon, LogInIcon, LogOutIcon, DownloadIcon, UploadIcon, ChevronRightIcon } from './components/icons';

type ActiveView = 'monthly' | 'master' | 'previous' | 'wo-stats' | 'player-management';

function App() {
  const [appState, setAppState] = useState<AppState>(() => sanitizeState(initialData));
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('monthly');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedGroupMatch, setSelectedGroupMatch] = useState<Match | null>(null);
  const [selectedBracketMatch, setSelectedBracketMatch] = useState<BracketMatch | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loader = document.getElementById('initial-loader-container');
    if (loader) loader.style.display = 'none';
  }, []);
  
  const handleLogout = () => {
    setIsAdmin(false);
  };
  
  const { players, monthlyData, currentMonthIndex } = appState;
  const currentMonth = monthlyData[currentMonthIndex];
  
  if (!currentMonth) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4">
        <div className="text-white text-xl text-center">
          <h1>Erro de Dados</h1>
          <p className="text-base mt-2">Não foi possível carregar os dados do mês atual. O estado pode estar corrompido.</p>
        </div>
      </div>
    );
  }

  const masterContenders = useMemo(() => {
    if (!players || players.length === 0) return [];
    const sorted = [...players].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.name.localeCompare(b.name);
    });
    return sorted.slice(0, 16);
  }, [players]);

  const dynamicMasterBracket = useMemo(() => {
    if (masterContenders.length < 16) return [];
    
    const { masterBracket: storedBracket } = appState;
    
    const isMasterTournamentStarted = storedBracket.some(match => match.winnerId !== null);

    if (isMasterTournamentStarted) {
        return storedBracket;
    }

    return generateMasterBracket(masterContenders);

  }, [appState, masterContenders]);
  
  const handleMatchClick = (match: Match | BracketMatch, type: 'group' | 'bracket') => {
      if (!isAdmin) return;
      if (type === 'group') {
          setSelectedGroupMatch(match as Match);
      } else {
          const bracketMatch = match as BracketMatch;
          if(bracketMatch.player1Id && bracketMatch.player2Id) {
             setSelectedBracketMatch(bracketMatch);
          }
      }
      setIsMatchModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsMatchModalOpen(false);
    setSelectedGroupMatch(null);
    setSelectedBracketMatch(null);
  }, []);
  
  const handleSaveBracketResult = (
    matchToUpdate: BracketMatch, newWinnerId: number, newScore: string
  ) => {
    const { masterBracket: currentBracket } = appState;
    let updatedBracket = [...currentBracket];
    
    if (!currentBracket.some(m => m.winnerId !== null)) {
      updatedBracket = dynamicMasterBracket;
    }

    const matchIndex = updatedBracket.findIndex(m => m.id === matchToUpdate.id);
    if (matchIndex === -1) return;
    
    updatedBracket[matchIndex] = {
      ...updatedBracket[matchIndex],
      winnerId: newWinnerId,
      score: newScore
    };

    const nextMatch = updatedBracket.find(
      m => m.sourceMatch1Id === matchToUpdate.id || m.sourceMatch2Id === matchToUpdate.id
    );

    if (nextMatch) {
      const nextMatchIndex = updatedBracket.findIndex(m => m.id === nextMatch.id);
      const updatedNextMatch = { ...updatedBracket[nextMatchIndex] };

      if (updatedNextMatch.sourceMatch1Id === matchToUpdate.id) {
        updatedNextMatch.player1Id = newWinnerId;
      } else if (updatedNextMatch.sourceMatch2Id === matchToUpdate.id) {
        updatedNextMatch.player2Id = newWinnerId;
      }
      
      updatedBracket[nextMatchIndex] = updatedNextMatch;
    }
    
    const newState = { ...appState, masterBracket: updatedBracket };
    setAppState(newState);
    handleCloseModal();
  };
  
  const revertPlayerStatsFromMatch = (player: Player, opponentId: number, match: Match, wasWinner: boolean): Player => {
      const updatedPlayer = { ...player };
      const setCounts = parseScore(match.score, match.player1Id, match.player2Id);
      const playerSetsWon = setCounts[player.id];
      
      updatedPlayer.gamesPlayed -= 1;
      updatedPlayer.monthlyGamesPlayed -= 1;

      if (wasWinner) {
          updatedPlayer.wins -= 1;
          updatedPlayer.monthlyWins -= 1;
          if (match.isWO) {
              updatedPlayer.totalWoWins -= 1;
              updatedPlayer.monthlyWoWins -= 1;
          }
      } else {
          updatedPlayer.losses -= 1;
          updatedPlayer.monthlyLosses -= 1;
          if (match.isWO) {
              updatedPlayer.totalWoLosses -= 1;
              updatedPlayer.monthlyWoLosses -= 1;
          }
      }

      const pointsToRevert = 2 + playerSetsWon + (wasWinner ? 10 : 0);
      updatedPlayer.pointsFromGames -= 2;
      updatedPlayer.monthlyPointsFromGames -= 2;
      updatedPlayer.setsWon -= playerSetsWon;
      updatedPlayer.monthlySetsWon -= playerSetsWon;
      
      if (!match.isWO || (match.isWO && wasWinner)) {
          updatedPlayer.totalPoints -= pointsToRevert;
          updatedPlayer.monthlyPoints -= pointsToRevert;
      }

      return updatedPlayer;
  };

  const handleSaveGroupMatchResult = (
    matchToUpdate: Match, newWinnerId: number, newScore: string, newIsWO: boolean
  ) => {
    const { players: currentPlayers, monthlyData: currentMonthlyData } = appState;
    const originalMatch = currentMonth.matches.find(m => m.id === matchToUpdate.id);
    if (!originalMatch) return;

    const updatedPlayersMap = new Map<number, Player>(currentPlayers.map(p => [p.id, JSON.parse(JSON.stringify(p))]));
    
    if (originalMatch.winnerId) {
      const oldWinner = updatedPlayersMap.get(originalMatch.winnerId)!;
      const oldLoserId = originalMatch.winnerId === originalMatch.player1Id ? originalMatch.player2Id : originalMatch.player1Id;
      const oldLoser = updatedPlayersMap.get(oldLoserId)!;

      updatedPlayersMap.set(oldWinner.id, revertPlayerStatsFromMatch(oldWinner, oldLoserId, originalMatch, true));
      updatedPlayersMap.set(oldLoser.id, revertPlayerStatsFromMatch(oldLoser, oldWinner.id, originalMatch, false));
    }

    const newWinner = updatedPlayersMap.get(newWinnerId)!;
    const newLoserId = newWinnerId === matchToUpdate.player1Id ? matchToUpdate.player2Id : matchToUpdate.player1Id;
    const newLoser = updatedPlayersMap.get(newLoserId)!;

    if (newIsWO) { newWinner.totalWoWins += 1; newWinner.monthlyWoWins += 1; newLoser.totalWoLosses += 1; newLoser.monthlyWoLosses += 1; }
    
    const newSetCounts = parseScore(newScore, matchToUpdate.player1Id, matchToUpdate.player2Id);
    const winnerSetPoints = newSetCounts[newWinnerId];
    const winnerPointsToAdd = (10 + 2 + winnerSetPoints);

    newWinner.wins += 1; newWinner.monthlyWins += 1;
    newWinner.gamesPlayed += 1; newWinner.monthlyGamesPlayed += 1;
    newWinner.pointsFromGames += 2; newWinner.monthlyPointsFromGames += 2;
    newWinner.setsWon += newSetCounts[newWinnerId]; newWinner.monthlySetsWon += newSetCounts[newWinnerId];
    newWinner.totalPoints += winnerPointsToAdd; newWinner.monthlyPoints += winnerPointsToAdd;

    newLoser.losses += 1; newLoser.monthlyLosses += 1;
    newLoser.gamesPlayed += 1; newLoser.monthlyGamesPlayed += 1;
    if (!newIsWO) {
        const loserSetPoints = newSetCounts[newLoserId];
        const loserPointsToAdd = (2 + loserSetPoints);
        newLoser.pointsFromGames += 2; newLoser.monthlyPointsFromGames += 2;
        newLoser.setsWon += newSetCounts[newLoserId]; newLoser.monthlySetsWon += newSetCounts[newLoserId];
        newLoser.totalPoints += loserPointsToAdd; newLoser.monthlyPoints += loserPointsToAdd;
    }
    
    const newMonthlyData = [...currentMonthlyData];
    const currentMonthData = { ...newMonthlyData[currentMonthIndex] };
    currentMonthData.matches = currentMonthData.matches.map(m =>
        m.id === matchToUpdate.id ? { ...m, winnerId: newWinnerId, score: newScore, isWO: newIsWO, isNotPlayed: false } : m
    );
    newMonthlyData[currentMonthIndex] = currentMonthData;
    
    const newState = { ...appState, players: Array.from(updatedPlayersMap.values()), monthlyData: newMonthlyData };
    setAppState(newState);
    handleCloseModal();
  };

  const handleResetGroupMatchResult = useCallback((matchToReset: Match) => {
    const matchFromState = currentMonth.matches.find(m => m.id === matchToReset.id);
    if (!matchFromState) return;

    const player1Name = players.find(p => p.id === matchFromState.player1Id)?.name;
    const player2Name = players.find(p => p.id === matchFromState.player2Id)?.name;

    if (!window.confirm(`Tem certeza que deseja resetar o resultado do jogo entre ${player1Name} e ${player2Name}?`)) return;

    const { players: currentPlayers, monthlyData: currentMonthlyData } = appState;
    const updatedPlayersMap = new Map<number, Player>(currentPlayers.map(p => [p.id, JSON.parse(JSON.stringify(p))]));
    
    if (matchFromState.winnerId) {
        const oldWinner = updatedPlayersMap.get(matchFromState.winnerId)!;
        const oldLoserId = matchFromState.winnerId === matchFromState.player1Id ? matchFromState.player2Id : matchFromState.player1Id;
        const oldLoser = updatedPlayersMap.get(oldLoserId)!;
        updatedPlayersMap.set(oldWinner.id, revertPlayerStatsFromMatch(oldWinner, oldLoserId, matchFromState, true));
        updatedPlayersMap.set(oldLoser.id, revertPlayerStatsFromMatch(oldLoser, oldWinner.id, matchFromState, false));
    }
    
    const newMonthlyData = [...currentMonthlyData];
    const updatedCurrentMonthData = { ...newMonthlyData[currentMonthIndex] };
    updatedCurrentMonthData.matches = updatedCurrentMonthData.matches.map(m =>
        m.id === matchFromState.id ? { ...m, winnerId: null, score: '', isWO: false, isNotPlayed: false } : m
    );
    newMonthlyData[currentMonthIndex] = updatedCurrentMonthData;
    
    const newState = { ...appState, players: Array.from(updatedPlayersMap.values()), monthlyData: newMonthlyData };
    setAppState(newState);
    handleCloseModal();
  }, [appState, players, currentMonth, handleCloseModal]);
  
  const handleSetMatchAsNotPlayed = useCallback((matchToUpdate: Match) => {
    const matchFromState = currentMonth.matches.find(m => m.id === matchToUpdate.id);
    if (!matchFromState) return;
    
    const { players: currentPlayers, monthlyData: currentMonthlyData } = appState;
    const updatedPlayersMap = new Map<number, Player>(currentPlayers.map(p => [p.id, JSON.parse(JSON.stringify(p))]));
    
    if (matchFromState.winnerId) {
        const oldWinner = updatedPlayersMap.get(matchFromState.winnerId)!;
        const oldLoserId = matchFromState.winnerId === matchFromState.player1Id ? matchFromState.player2Id : matchFromState.player1Id;
        const oldLoser = updatedPlayersMap.get(oldLoserId)!;
        updatedPlayersMap.set(oldWinner.id, revertPlayerStatsFromMatch(oldWinner, oldLoserId, matchFromState, true));
        updatedPlayersMap.set(oldLoser.id, revertPlayerStatsFromMatch(oldLoser, oldWinner.id, matchFromState, false));
    }

    const newMonthlyData = [...currentMonthlyData];
    const updatedCurrentMonthData = { ...newMonthlyData[currentMonthIndex] };
    updatedCurrentMonthData.matches = updatedCurrentMonthData.matches.map(m =>
        m.id === matchFromState.id ? { ...m, winnerId: null, score: 'Não Jogado', isWO: false, isNotPlayed: true } : m
    );
    newMonthlyData[currentMonthIndex] = updatedCurrentMonthData;

    const newState = { ...appState, players: Array.from(updatedPlayersMap.values()), monthlyData: newMonthlyData };
    setAppState(newState);
    handleCloseModal();
  }, [appState, players, currentMonth, handleCloseModal]);
  
  const handleResetBracketMatchResult = useCallback((matchToReset: BracketMatch) => {
    const matchFromState = appState.masterBracket.find(m => m.id === matchToReset.id);
    if (!matchFromState || !matchFromState.winnerId) {
        console.error("Cannot reset bracket match: Match not found in state or no winner to reset.");
        return;
    }

    if (!window.confirm(`Tem certeza que deseja resetar o resultado desta partida da chave?`)) return;

    const { masterBracket: currentBracket } = appState;
    let updatedBracket = [...currentBracket];

    const nextMatch = updatedBracket.find(
      m => m.sourceMatch1Id === matchFromState.id || m.sourceMatch2Id === matchFromState.id
    );

    if (nextMatch) {
      const nextMatchIndex = updatedBracket.findIndex(m => m.id === nextMatch.id);
      const updatedNextMatch = { ...updatedBracket[nextMatchIndex] };

      if (updatedNextMatch.winnerId) {
          alert("Não é possível resetar este jogo pois o jogo seguinte na chave já foi concluído.");
          return;
      }

      if (updatedNextMatch.sourceMatch1Id === matchFromState.id) {
        updatedNextMatch.player1Id = null;
      } else if (updatedNextMatch.sourceMatch2Id === matchFromState.id) {
        updatedNextMatch.player2Id = null;
      }
      
      updatedBracket[nextMatchIndex] = updatedNextMatch;
    }

    const matchIndex = updatedBracket.findIndex(m => m.id === matchFromState.id);
    if (matchIndex !== -1) {
        updatedBracket[matchIndex] = {
            ...updatedBracket[matchIndex],
            winnerId: null,
            score: '',
        };
    }
    
    const newState = { ...appState, masterBracket: updatedBracket };
    setAppState(newState);
    handleCloseModal();
  }, [appState, handleCloseModal]);

  const handleAdvanceMonth = () => {
    if (!window.confirm("Tem certeza que deseja avançar para o próximo mês? Esta ação criará novos grupos e não pode ser desfeita.")) {
        return;
    }
    
    const sortedPlayers = [...players].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name);
    });
    
    const playersForNewMonth = players.map(p => ({ ...p, monthlyPoints: 0, monthlyWins: 0, monthlyLosses: 0, monthlyGamesPlayed: 0, monthlySetsWon: 0, monthlyPointsFromGames: 0, monthlyWoWins: 0, monthlyWoLosses: 0 }));
    const newMonthId = currentMonth.id + 1;
    const newGroups: Group[] = [];
    const newMatches: Match[] = [];
    const playersPerGroup = 4;
    const numGroups = Math.ceil(players.length / playersPerGroup);
    
    for (let i = 0; i < numGroups; i++) {
        const groupPlayerIds = sortedPlayers.slice(i * playersPerGroup, (i + 1) * playersPerGroup).map(p => p.id);
        const group: Group = { id: i + 1, name: `Grupo ${i + 1}`, playerIds: groupPlayerIds };
        newGroups.push(group);
        for (let j = 0; j < groupPlayerIds.length; j++) {
            for (let k = j + 1; k < groupPlayerIds.length; k++) {
                const p1Id = groupPlayerIds[j];
                const p2Id = groupPlayerIds[k];
                newMatches.push({ id: `m${newMonthId}-g${group.id}-p${p1Id}-vs-p${p2Id}`, player1Id: p1Id, player2Id: p2Id, winnerId: null, score: '', isWO: false, isNotPlayed: false });
            }
        }
    }
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const newMonthName = monthNames[(new Date().getMonth() + (currentMonthIndex + 1)) % 12];
    const nextMonth: MonthlyData = { id: newMonthId, name: newMonthName, groups: newGroups, matches: newMatches };

    const newAppState: AppState = {
      ...appState,
      players: playersForNewMonth,
      monthlyData: [...appState.monthlyData, nextMonth],
      currentMonthIndex: appState.currentMonthIndex + 1,
      masterBracket: generateMasterBracket(masterContenders)
    };
    
    setAppState(newAppState);
  };
  
  const handleUpdatePlayerName = useCallback((playerId: number, newName: string) => {
    setAppState(prevState => {
        if (!prevState) return prevState;
        const updatedPlayers = prevState.players.map(p => 
            p.id === playerId ? { ...p, name: newName } : p
        );
        return { ...prevState, players: updatedPlayers };
    });
  }, []);

  const handleExportCsv = () => {
    if (!players || players.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const sortedPlayers = [...players].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        return a.name.localeCompare(b.name);
    });

    const headers = [
        "Rank", "Jogador",
        "Pontos (Geral)", "Jogos (Geral)", "Vitorias (Geral)", "Derrotas (Geral)", "Sets Ganhos (Geral)", "Pontos Jogos (Geral)", "Vitorias W.O (Geral)", "Derrotas W.O (Geral)",
        "Pontos (Mes)", "Jogos (Mes)", "Vitorias (Mes)", "Derrotas (Mes)", "Sets Ganhos (Mes)", "Pontos Jogos (Mes)", "Vitorias W.O (Mes)", "Derrotas W.O (Mes)"
    ];

    const csvRows = [headers.join(',')];

    sortedPlayers.forEach((p, index) => {
        const rank = index + 1;
        const row = [
            rank,
            `"${p.name}"`, 
            p.totalPoints, p.gamesPlayed, p.wins, p.losses, p.setsWon, p.pointsFromGames, p.totalWoWins, p.totalWoLosses,
            p.monthlyPoints, p.monthlyGamesPlayed, p.monthlyWins, p.monthlyLosses, p.monthlySetsWon, p.monthlyPointsFromGames, p.monthlyWoWins, p.monthlyWoLosses
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ranking_geral_mes_de_${currentMonth?.name.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportState = () => {
    try {
      const jsonString = JSON.stringify(appState, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `ranking_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export state:", error);
      alert("Ocorreu um erro ao exportar os dados.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      if(event.target) event.target.value = '';
      return;
    }

    if (!window.confirm("Tem certeza que deseja carregar este arquivo? Esta ação substituirá TODOS os dados atuais e não pode ser desfeita.")) {
      if(event.target) event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not readable.");
        
        const importedData = JSON.parse(text);
        const validatedState = sanitizeState(importedData);
        
        setAppState(validatedState);
        alert("Dados importados com sucesso! Suas alterações são mantidas apenas nesta sessão. Lembre-se de baixar um backup antes de fechar.");

      } catch (error) {
        console.error("Error processing uploaded file:", error);
        alert("Erro ao processar o arquivo. Certifique-se de que é um backup válido no formato JSON.");
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
      alert("Erro ao ler o arquivo.");
      if(event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const matchForModal = useMemo(() => {
    if (selectedGroupMatch) {
      const player1 = players.find(p => p.id === selectedGroupMatch.player1Id);
      const player2 = players.find(p => p.id === selectedGroupMatch.player2Id);
      if (!player1 || !player2) return null;
      return { match: selectedGroupMatch, player1, player2, isBracket: false };
    }
    if (selectedBracketMatch) {
      const player1 = players.find(p => p.id === selectedBracketMatch.player1Id);
      const player2 = players.find(p => p.id === selectedBracketMatch.player2Id);
      if (!player1 || !player2) return null;
      return { match: selectedBracketMatch, player1, player2, isBracket: true };
    }
    return null;
  }, [selectedGroupMatch, selectedBracketMatch, players]);
    
  const handleSaveWrapper = (match: Match | BracketMatch, newWinnerId: number, newScore: string, newIsWO: boolean) => {
    if (selectedGroupMatch) {
      handleSaveGroupMatchResult(match as Match, newWinnerId, newScore, newIsWO);
    } else if (selectedBracketMatch) {
      handleSaveBracketResult(match as BracketMatch, newWinnerId, newScore);
    }
  };

  const handleResetWrapper = () => {
    if (selectedGroupMatch) {
      handleResetGroupMatchResult(selectedGroupMatch);
    } else if (selectedBracketMatch) {
      handleResetBracketMatchResult(selectedBracketMatch);
    }
  };
  
  const handleSetNotPlayedWrapper = () => {
      if (selectedGroupMatch) {
        handleSetMatchAsNotPlayed(selectedGroupMatch);
      }
  };
  
  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <header className="bg-slate-800 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">Ranking Tênis</h1>
          
          <div className="hidden md:flex items-center space-x-2">
            <button onClick={() => setActiveView('monthly')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${activeView === 'monthly' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              <CalendarIcon className="w-4 h-4 mr-2"/> Mês Atual
            </button>
            <button onClick={() => setActiveView('master')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${activeView === 'master' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              <TournamentIcon className="w-4 h-4 mr-2"/> Chave Master
            </button>
            <button onClick={() => setActiveView('previous')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${activeView === 'previous' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              <CalendarIcon className="w-4 h-4 mr-2"/> Meses Anteriores
            </button>
             <button onClick={() => setActiveView('wo-stats')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${activeView === 'wo-stats' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              <UserSlashIcon className="w-4 h-4 mr-2"/> Estatísticas W.O.
            </button>
            <button onClick={() => setActiveView('player-management')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${activeView === 'player-management' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              <UsersIcon className="w-4 h-4 mr-2"/> Jogadores
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin ? (
                <>
                  <button onClick={handleAdvanceMonth} title="Avançar Mês" className="px-3 py-2 text-sm font-medium rounded-md flex items-center bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">
                    Avançar Mês <ChevronRightIcon className="w-4 h-4 ml-1"/>
                  </button>
                  <button onClick={handleExportCsv} className="px-3 py-2 text-sm font-medium rounded-md bg-green-700 hover:bg-green-600 transition-colors">
                    Exportar CSV
                  </button>
                  <button onClick={handleUploadClick} title="Carregar Backup" className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors">
                    <UploadIcon className="w-5 h-5"/>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
                  <button onClick={handleExportState} title="Baixar Backup" className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors">
                    <DownloadIcon className="w-5 h-5"/>
                  </button>
                  <button onClick={handleLogout} title="Sair" className="p-2 rounded-md bg-red-800 text-red-100 hover:bg-red-700 transition-colors">
                      <LogOutIcon className="w-5 h-5"/>
                  </button>
                </>
            ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="px-3 py-2 text-sm font-medium rounded-md flex items-center bg-slate-700 hover:bg-slate-600 transition-colors">
                  <LogInIcon className="w-4 h-4 mr-2"/> Admin
                </button>
            )}
          </div>
        </div>
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
           <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex justify-around">
             <button onClick={() => setActiveView('monthly')} className={`p-2 rounded-md flex flex-col items-center text-xs w-full ${activeView === 'monthly' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}><CalendarIcon className="w-5 h-5 mb-1"/> Mês</button>
             <button onClick={() => setActiveView('master')} className={`p-2 rounded-md flex flex-col items-center text-xs w-full ${activeView === 'master' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}><TournamentIcon className="w-5 h-5 mb-1"/> Master</button>
             <button onClick={() => setActiveView('previous')} className={`p-2 rounded-md flex flex-col items-center text-xs w-full ${activeView === 'previous' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}><CalendarIcon className="w-5 h-5 mb-1"/> Anteriores</button>
             <button onClick={() => setActiveView('wo-stats')} className={`p-2 rounded-md flex flex-col items-center text-xs w-full ${activeView === 'wo-stats' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}><UserSlashIcon className="w-5 h-5 mb-1"/> W.O.</button>
             <button onClick={() => setActiveView('player-management')} className={`p-2 rounded-md flex flex-col items-center text-xs w-full ${activeView === 'player-management' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}><UsersIcon className="w-5 h-5 mb-1"/> Jogadores</button>
           </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PlayerRankingTable players={players} />
          </div>
          <div className="lg:col-span-2">
            {activeView === 'monthly' && <MonthView monthData={currentMonth} players={players} onMatchClick={(m) => handleMatchClick(m, 'group')} isAdmin={isAdmin} />}
            {activeView === 'master' && <MasterBracket players={players} contenders={masterContenders} bracketData={dynamicMasterBracket} onMatchClick={(m) => handleMatchClick(m, 'bracket')} isAdmin={isAdmin} />}
            {activeView === 'previous' && <PreviousMonthRanking />}
            {activeView === 'wo-stats' && <WoStatsTable players={players} />}
            {activeView === 'player-management' && <PlayerManagement players={players} isAdmin={isAdmin} onUpdatePlayerName={handleUpdatePlayerName} />}
          </div>
        </div>
      </main>

      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onSuccess={() => { setIsAdmin(true); setIsLoginModalOpen(false); }} />}
      
      {isMatchModalOpen && matchForModal && (
        <MatchResultModal
          match={matchForModal.match}
          player1={matchForModal.player1}
          player2={matchForModal.player2}
          onClose={handleCloseModal}
          onSave={handleSaveWrapper}
          onReset={handleResetWrapper}
          onSetNotPlayed={handleSetNotPlayedWrapper}
          isBracketMatch={matchForModal.isBracket}
        />
      )}
    </div>
  );
}

export default App;
