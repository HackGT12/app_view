export const SPORTS_KNOWLEDGE_BASE = {
  'NFL': 'NFL (National Football League) - American football league with 32 teams. Season runs September-February. Common bets: point spreads, over/under totals, moneylines, player props. Key stats: touchdowns, yards, turnovers.',
  
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