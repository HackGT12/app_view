export const SPORTS_KNOWLEDGE_BASE = {
  'NFL': `NFL (National Football League) – The top professional American football league with 32 teams divided into two conferences (AFC & NFC), each split into four divisions. Regular season runs September–January, followed by playoffs and the Super Bowl in February. Each team plays 17 games over 18 weeks.

Betting types:
- Point Spreads: Most common NFL bet. Sportsbooks set a margin of victory (spread). Favorite must win by more than the spread; underdog can cover by losing within the spread or winning outright.
- Moneylines: Simple win/loss bet on which team wins the game.
- Totals (Over/Under): Betting whether total combined points scored goes over or under a line set by sportsbooks.
- Player Props: Bets on individual performance stats, e.g., passing yards, rushing yards, receptions, touchdowns.
- Team Props: Bets on specific team outcomes, e.g., first team to score, total touchdowns, turnovers.
- Live/In-Game Bets: Wagers placed during the game as odds shift in real time.
- Parlays & Same-Game Parlays: Combine multiple bets for higher payouts, but all must hit.
- Futures: Long-term bets (e.g., Super Bowl winner, MVP, division champions).

Key stats to consider:
- Offensive Metrics: Passing yards, rushing yards, touchdowns, yards per play, 3rd-down conversion rate.
- Defensive Metrics: Sacks, interceptions, forced fumbles, opponent yards per play.
- Special Teams: Field goal %, punt returns, kick returns.
- Turnover Differential: Huge predictor of outcomes.
- Injuries: Especially QB, offensive line, or key defensive players.
- Weather: Wind, snow, and rain affect scoring and passing/rushing balance.

Game structure:
- Four 15-minute quarters, with halftime after the 2nd quarter.
- Overtime (10 minutes, sudden death rules with modifications).
- Possessions start with kickoffs or punts; scoring via touchdowns (6 pts + extra point/2-pt conversion), field goals (3 pts), safeties (2 pts).

Context for bettors:
- NFL games are slower paced than NBA/MLS, so micro-bets often revolve around next play outcomes (e.g., run vs. pass, completion vs. incompletion, next team to score).
- Prime-time games (Thursday, Sunday night, Monday) draw the heaviest action and sharper lines.
- Public betting often leans toward favorites and overs, which creates value for underdogs and unders in some cases.`,
  
  'NBA': 'NBA (National Basketball Association) - Professional basketball with 30 teams. Season runs October-June. Common bets: point spreads, totals, moneylines, player props (points, rebounds, assists). Fast-paced scoring.',
  
  'MLB': 'MLB (Major League Baseball) - 30 teams, 162-game season April-October. Common bets: moneylines, run totals, innings bets, player props (hits, home runs, RBIs). Pitching matchups crucial.',
  
  'NHL': 'NHL (National Hockey League) - Ice hockey with 32 teams. Season October-June. Common bets: moneylines, puck lines, totals, period bets, player props (goals, assists, shots). Goaltending key.',
  
  'MLS': 'MLS (Major League Soccer) - North American soccer league with 29 teams. Season February-December. Common bets: moneylines, spreads, totals, both teams to score. 90-minute regulation plus stoppage time.',
  
  'NCAA Football': 'College football with over 100 teams across divisions. Season August-January. Common bets: point spreads, totals, moneylines, conference championships. Higher scoring than NFL typically.',
  
  'Premier League': 'English soccer league with 20 teams. Season August-May, 38 games each. Common bets: match results, totals, both teams to score, relegation/promotion. No playoffs - points determine champion.',
  
  'Formula 1': 'International auto racing with 20+ races per season. Common bets: race winner, podium finishes, fastest lap, constructor championship. Qualifying position affects race odds significantly.',
  
  'ChatGPT': 'General sports betting assistant mode. Provides information about betting basics, odds, strategies, and general sports knowledge across all leagues and sports.'
};

export const getKnowledgeBase = (league: string): string => {
  return SPORTS_KNOWLEDGE_BASE[league as keyof typeof SPORTS_KNOWLEDGE_BASE] || SPORTS_KNOWLEDGE_BASE['ChatGPT'];
};