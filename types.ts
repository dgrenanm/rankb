export interface Player {
  id: number;
  name: string;
  
  // Overall Stats
  totalPoints: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  setsWon: number;
  pointsFromGames: number;
  totalWoWins: number;
  totalWoLosses: number;

  // Monthly Stats
  monthlyPoints: number;
  monthlyWins: number;
  monthlyLosses: number;
  monthlyGamesPlayed: number;
  monthlySetsWon: number;
  monthlyPointsFromGames: number;
  monthlyWoWins: number;
  monthlyWoLosses: number;
}

export interface Match {
  id: string;
  player1Id: number;
  player2Id: number;
  winnerId: number | null;
  score: string;
  isWO: boolean;
  isNotPlayed: boolean;
}

export interface Group {
  id: number;
  name: string;
  playerIds: number[];
}

export interface MonthlyData {
  id: number;
  name: string;
  groups: Group[];
  matches: Match[];
}

export interface BracketMatch {
  id: string; // e.g., 'R16-0', 'QF-0'
  round: 'R16' | 'QF' | 'SF' | 'F';
  matchIndex: number; // 0-based index within the round
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  score: string;
  sourceMatch1Id?: string; // ID of the match that provides player1
  sourceMatch2Id?: string; // ID of the match that provides player2
}

export interface AppState {
  players: Player[];
  monthlyData: MonthlyData[];
  currentMonthIndex: number;
  masterBracket: BracketMatch[];
}