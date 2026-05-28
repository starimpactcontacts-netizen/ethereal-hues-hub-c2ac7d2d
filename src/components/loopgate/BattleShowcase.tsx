import BattleAutoplayDuo from "@/components/loopgate/BattleAutoplayDuo";

type Side = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  url: string;
  color: "red" | "blue";
  posterUrl?: string | null;
};

interface Props {
  sides: [Side, Side];
  redScore?: number;
  blueScore?: number;
  showcaseStartedAt?: string | null;
  onComplete?: () => void;
}

export default function BattleShowcase({ sides, redScore = 0, blueScore = 0 }: Props) {
  return (
    <BattleAutoplayDuo
      red={sides[0]}
      blue={sides[1]}
      redScore={redScore}
      blueScore={blueScore}
    />
  );
}
