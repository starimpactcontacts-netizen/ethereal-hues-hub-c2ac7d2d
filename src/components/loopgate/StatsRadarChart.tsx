import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface StatsRadarChartProps {
  indexScore: number;
  winRate: number;
  totalEvents: number;
  classLetter: string;
  league: string;
}

const classToValue: Record<string, number> = {
  'S++': 100, 'S+': 95, 'S': 90,
  'A': 75, 'B': 60, 'C': 45,
  'D': 30, 'F': 10,
};

const leagueToValue: Record<string, number> = {
  elite: 100, pro: 65, open: 30,
};

export default function StatsRadarChart({ indexScore, winRate, totalEvents, classLetter, league }: StatsRadarChartProps) {
  const data = [
    { stat: 'INDEX', value: Math.min(100, indexScore), fullMark: 100 },
    { stat: 'WIN %', value: winRate, fullMark: 100 },
    { stat: 'EVENTS', value: Math.min(100, totalEvents * 5), fullMark: 100 },
    { stat: 'CLASS', value: classToValue[classLetter] || 10, fullMark: 100 },
    { stat: 'LEAGUE', value: leagueToValue[league] || 30, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid
            stroke="hsl(var(--foreground) / 0.1)"
            strokeWidth={0.5}
          />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 700, letterSpacing: '0.08em' }}
          />
          <Radar
            name="Stats"
            dataKey="value"
            stroke="hsl(var(--gold))"
            fill="hsl(var(--gold))"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
