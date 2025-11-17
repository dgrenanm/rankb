import { Player, Group, Match, MonthlyData, BracketMatch, AppState } from '../types';

export const parseScore = (score: string, player1Id: number, player2Id: number): { [playerId: number]: number } => {
  if (!score || score.trim() === '') {
    return { [player1Id]: 0, [player2Id]: 0 };
  }

  const sets = score.trim().split(/\s+/);
  let p1SetsWon = 0;
  let p2SetsWon = 0;

  for (const set of sets) {
    const games = set.split('-').map(g => parseInt(g, 10));
    if (games.length === 2 && !isNaN(games[0]) && !isNaN(games[1])) {
      if (games[0] > games[1]) {
        p1SetsWon++;
      } else if (games[1] > games[0]) {
        p2SetsWon++;
      }
    }
  }

  return {
    [player1Id]: p1SetsWon,
    [player2Id]: p2SetsWon,
  };
};

export const generateMasterBracket = (contenders: Player[]): BracketMatch[] => {
  if (contenders.length < 16) return [];

  const bracket: BracketMatch[] = [];
  
  const seeds = [0, 15, 7, 8, 4, 11, 3, 12, 5, 10, 2, 13, 6, 9, 1, 14];
  
  for (let i = 0; i < 8; i++) {
    bracket.push({
      id: `R16-${i}`,
      round: 'R16',
      matchIndex: i,
      player1Id: contenders[seeds[i * 2]].id,
      player2Id: contenders[seeds[i * 2 + 1]].id,
      winnerId: null,
      score: '',
    });
  }

  for (let i = 0; i < 4; i++) {
    bracket.push({
      id: `QF-${i}`,
      round: 'QF',
      matchIndex: i,
      player1Id: null,
      player2Id: null,
      winnerId: null,
      score: '',
      sourceMatch1Id: `R16-${i * 2}`,
      sourceMatch2Id: `R16-${i * 2 + 1}`,
    });
  }

  for (let i = 0; i < 2; i++) {
    bracket.push({
      id: `SF-${i}`,
      round: 'SF',
      matchIndex: i,
      player1Id: null,
      player2Id: null,
      winnerId: null,
      score: '',
      sourceMatch1Id: `QF-${i * 2}`,
      sourceMatch2Id: `QF-${i * 2 + 1}`,
    });
  }

  bracket.push({
    id: 'F-0',
    round: 'F',
    matchIndex: 0,
    player1Id: null,
    player2Id: null,
    winnerId: null,
    score: '',
    sourceMatch1Id: 'SF-0',
    sourceMatch2Id: 'SF-1',
  });
  
  return bracket;
};

// Ensures that player objects have all necessary fields with default values.
const sanitizePlayer = (player: Partial<Player>): Player => ({
  id: player.id ?? 0,
  name: player.name ?? 'Unknown',
  totalPoints: player.totalPoints ?? 0,
  wins: player.wins ?? 0,
  losses: player.losses ?? 0,
  gamesPlayed: player.gamesPlayed ?? 0,
  setsWon: player.setsWon ?? 0,
  pointsFromGames: player.pointsFromGames ?? 0,
  totalWoWins: player.totalWoWins ?? 0,
  totalWoLosses: player.totalWoLosses ?? 0,
  monthlyPoints: player.monthlyPoints ?? 0,
  monthlyWins: player.monthlyWins ?? 0,
  monthlyLosses: player.monthlyLosses ?? 0,
  monthlyGamesPlayed: player.monthlyGamesPlayed ?? 0,
  monthlySetsWon: player.monthlySetsWon ?? 0,
  monthlyPointsFromGames: player.monthlyPointsFromGames ?? 0,
  monthlyWoWins: player.monthlyWoWins ?? 0,
  monthlyWoLosses: player.monthlyWoLosses ?? 0,
});

const sanitizeMatch = (match: Partial<Match>): Match => ({
  id: match.id ?? '',
  player1Id: match.player1Id ?? 0,
  player2Id: match.player2Id ?? 0,
  winnerId: match.winnerId !== undefined ? match.winnerId : null,
  score: match.score ?? '',
  isWO: match.isWO ?? false,
  isNotPlayed: match.isNotPlayed ?? false,
});

const sanitizeGroup = (group: Partial<Group>): Group => ({
  id: group.id ?? 0,
  name: group.name ?? '',
  playerIds: Array.isArray(group.playerIds) ? group.playerIds : [],
});

const sanitizeMonthlyData = (month: Partial<MonthlyData>): MonthlyData => ({
  id: month.id ?? 0,
  name: month.name ?? '',
  groups: Array.isArray(month.groups) ? month.groups.map(sanitizeGroup) : [],
  matches: Array.isArray(month.matches) ? month.matches.map(sanitizeMatch) : [],
});

const sanitizeBracketMatch = (match: Partial<BracketMatch>): BracketMatch => ({
  id: match.id ?? '',
  round: match.round ?? 'R16',
  matchIndex: match.matchIndex ?? 0,
  player1Id: match.player1Id !== undefined ? match.player1Id : null,
  player2Id: match.player2Id !== undefined ? match.player2Id : null,
  winnerId: match.winnerId !== undefined ? match.winnerId : null,
  score: match.score ?? '',
  sourceMatch1Id: match.sourceMatch1Id,
  sourceMatch2Id: match.sourceMatch2Id,
});

// Ensures the entire app state is well-formed.
export const sanitizeState = (state: any): AppState => {
  const sanitized = {
    players: Array.isArray(state.players) ? state.players.map(sanitizePlayer) : [],
    monthlyData: Array.isArray(state.monthlyData) ? state.monthlyData.map(sanitizeMonthlyData) : [],
    currentMonthIndex: typeof state.currentMonthIndex === 'number' ? state.currentMonthIndex : 0,
    masterBracket: Array.isArray(state.masterBracket) ? state.masterBracket.map(sanitizeBracketMatch) : [],
  };
  
  // Ensure currentMonthIndex is valid
  if (sanitized.currentMonthIndex >= sanitized.monthlyData.length) {
    sanitized.currentMonthIndex = Math.max(0, sanitized.monthlyData.length - 1);
  }

  return sanitized;
};