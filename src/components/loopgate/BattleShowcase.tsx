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
  showcaseStartedAt?: string | null;
  onComplete?: () => void;
}

export default function BattleShowcase({ sides }: Props) {
  return (
    <BattleAutoplayDuo
      red={sides[0]}
      blue={sides[1]}
    />
  );
}
