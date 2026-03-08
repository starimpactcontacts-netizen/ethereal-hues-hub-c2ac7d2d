import { useState } from "react";
import { Plus, Minus, Zap, Trophy, Clock, Eye, EyeOff, Users, Target, Percent, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface RoundConfig {
  round_type: 'open' | 'elimination' | 'threshold';
  advancement_type: 'top_x' | 'percentage' | 'manual' | 'none';
  advancement_value: number | null;
  threshold_qoi: number | null;
  max_submissions: number;
  index_reward: number;
  bonus_multiplier: number;
  duration_hours: number;
  auto_start_next: boolean;
  show_leaderboard: boolean;
}

interface OpenArenaConfig {
  total_rounds: number;
  max_editors: number | null;
  winner_logic: 'final_qoi' | 'cumulative_qoi' | 'manual';
  show_eliminated: boolean;
  hide_future_rounds: boolean;
  rounds: RoundConfig[];
}

interface OpenArenaFormProps {
  config: OpenArenaConfig;
  onChange: (config: OpenArenaConfig) => void;
}

const defaultRound: RoundConfig = {
  round_type: 'open',
  advancement_type: 'none',
  advancement_value: null,
  threshold_qoi: null,
  max_submissions: 1,
  index_reward: 50,
  bonus_multiplier: 1.0,
  duration_hours: 24,
  auto_start_next: false,
  show_leaderboard: true,
};

export function getDefaultOpenArenaConfig(): OpenArenaConfig {
  return {
    total_rounds: 1,
    max_editors: null,
    winner_logic: 'final_qoi',
    show_eliminated: true,
    hide_future_rounds: false,
    rounds: [{ ...defaultRound }],
  };
}

export default function OpenArenaForm({ config, onChange }: OpenArenaFormProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(0);

  const updateRounds = (totalRounds: number) => {
    const newRounds = [...config.rounds];
    while (newRounds.length < totalRounds) {
      const roundNum = newRounds.length + 1;
      newRounds.push({
        ...defaultRound,
        // Last round is typically open (finals), others are elimination
        round_type: roundNum === totalRounds ? 'open' : 'elimination',
        advancement_type: roundNum === totalRounds ? 'none' : 'top_x',
        advancement_value: roundNum === totalRounds ? null : 10,
        bonus_multiplier: roundNum === totalRounds ? 2.0 : 1.0,
      });
    }
    while (newRounds.length > totalRounds) {
      newRounds.pop();
    }
    onChange({ ...config, total_rounds: totalRounds, rounds: newRounds });
  };

  const updateRound = (index: number, updates: Partial<RoundConfig>) => {
    const newRounds = [...config.rounds];
    newRounds[index] = { ...newRounds[index], ...updates };
    onChange({ ...config, rounds: newRounds });
  };

  return (
    <div className="space-y-6 border-t border-gold/30 pt-4 mt-4">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-gold" />
        <span className="text-sm font-bold text-gold uppercase tracking-wider">Open Arena Mode</span>
        <Badge className="bg-gold/20 text-gold text-[10px]">MULTI-ROUND</Badge>
      </div>

      {/* Total Rounds */}
      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Total Rounds
        </Label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => updateRounds(num)}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${
                config.total_rounds === num
                  ? 'bg-gold text-black'
                  : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
              }`}
            >
              {num} Round{num > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Global Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Max Editors (optional)</Label>
          <Input
            type="number"
            min="0"
            value={config.max_editors || ''}
            onChange={(e) => onChange({ ...config, max_editors: e.target.value ? Number(e.target.value) : null })}
            placeholder="∞"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Winner Logic</Label>
          <select
            value={config.winner_logic}
            onChange={(e) => onChange({ ...config, winner_logic: e.target.value as any })}
            className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="final_qoi">Final Round QOI</option>
            <option value="cumulative_qoi">Cumulative QOI</option>
            <option value="manual">Manual Selection</option>
          </select>
        </div>
      </div>

      {/* Visibility Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-muted-foreground" />
            <span className="text-sm">Show Eliminated Users</span>
          </div>
          <Switch
            checked={config.show_eliminated}
            onCheckedChange={(checked) => onChange({ ...config, show_eliminated: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff size={14} className="text-muted-foreground" />
            <span className="text-sm">Hide Future Rounds</span>
          </div>
          <Switch
            checked={config.hide_future_rounds}
            onCheckedChange={(checked) => onChange({ ...config, hide_future_rounds: checked })}
          />
        </div>
      </div>

      {/* Round Configurations */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Settings2 size={14} />
          Round Configuration
        </Label>

        {config.rounds.map((round, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden ${
              expandedRound === index ? 'border-gold/50' : 'border-border'
            }`}
          >
            {/* Round Header */}
            <button
              onClick={() => setExpandedRound(expandedRound === index ? null : index)}
              className="w-full px-4 py-3 flex items-center justify-between bg-surface-1 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gold font-bold">R{index + 1}</span>
                <Badge
                  className={`text-[10px] ${
                    round.round_type === 'open'
                      ? 'bg-green-500/20 text-green-400'
                      : round.round_type === 'elimination'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {round.round_type.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {round.duration_hours}h • {round.index_reward} INDEX
                </span>
              </div>
              {expandedRound === index ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </button>

            {/* Round Details */}
            {expandedRound === index && (
              <div className="p-4 space-y-4 bg-background">
                {/* Round Type */}
                <div>
                  <Label className="text-xs">Round Type</Label>
                  <div className="flex gap-2 mt-2">
                    {(['open', 'elimination', 'threshold'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          const updates: Partial<RoundConfig> = { round_type: type };
                          if (type === 'open') {
                            updates.advancement_type = 'none';
                            updates.advancement_value = null;
                          } else if (type === 'elimination') {
                            updates.advancement_type = 'top_x';
                            updates.advancement_value = 10;
                          } else {
                            updates.advancement_type = 'none';
                            updates.threshold_qoi = 150;
                          }
                          updateRound(index, updates);
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                          round.round_type === type
                            ? type === 'open'
                              ? 'bg-green-500 text-white'
                              : type === 'elimination'
                              ? 'bg-orange-500 text-white'
                              : 'bg-purple-500 text-white'
                            : 'bg-surface-1 text-muted-foreground hover:bg-surface-2'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advancement Logic (for elimination rounds) */}
                {round.round_type === 'elimination' && (
                  <div className="space-y-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-400">
                      <Target size={14} />
                      <span className="text-xs font-semibold uppercase">Advancement Logic</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateRound(index, { advancement_type: 'top_x' })}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                          round.advancement_type === 'top_x'
                            ? 'bg-orange-500 text-white'
                            : 'bg-surface-1 text-muted-foreground'
                        }`}
                      >
                        <Users size={12} />
                        Top X
                      </button>
                      <button
                        onClick={() => updateRound(index, { advancement_type: 'percentage' })}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                          round.advancement_type === 'percentage'
                            ? 'bg-orange-500 text-white'
                            : 'bg-surface-1 text-muted-foreground'
                        }`}
                      >
                        <Percent size={12} />
                        Top %
                      </button>
                      <button
                        onClick={() => updateRound(index, { advancement_type: 'manual' })}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                          round.advancement_type === 'manual'
                            ? 'bg-orange-500 text-white'
                            : 'bg-surface-1 text-muted-foreground'
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                    {(round.advancement_type === 'top_x' || round.advancement_type === 'percentage') && (
                      <div>
                        <Label className="text-xs">
                          Advance Top {round.advancement_type === 'percentage' ? '%' : 'Editors'}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max={round.advancement_type === 'percentage' ? 100 : 1000}
                          value={round.advancement_value || ''}
                          onChange={(e) => updateRound(index, { advancement_value: Number(e.target.value) })}
                          placeholder={round.advancement_type === 'percentage' ? '25' : '10'}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Threshold Logic */}
                {round.round_type === 'threshold' && (
                  <div className="space-y-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Trophy size={14} />
                      <span className="text-xs font-semibold uppercase">QOI Threshold</span>
                    </div>
                    <div>
                      <Label className="text-xs">Minimum QOI to Advance</Label>
                      <Input
                        type="number"
                        min="0"
                        max="300"
                        value={round.threshold_qoi || ''}
                        onChange={(e) => updateRound(index, { threshold_qoi: Number(e.target.value) })}
                        placeholder="150"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Duration & Submissions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Clock size={12} />
                      Duration (hours)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="168"
                      value={round.duration_hours}
                      onChange={(e) => updateRound(index, { duration_hours: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Submissions</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={round.max_submissions}
                      onChange={(e) => updateRound(index, { max_submissions: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Sparkles size={12} className="text-gold" />
                      Index Reward
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      value={round.index_reward}
                      onChange={(e) => updateRound(index, { index_reward: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bonus Multiplier</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={round.bonus_multiplier}
                      onChange={(e) => updateRound(index, { bonus_multiplier: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  {index < config.rounds.length - 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-start next round</span>
                      <Switch
                        checked={round.auto_start_next}
                        onCheckedChange={(checked) => updateRound(index, { auto_start_next: checked })}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show leaderboard</span>
                    <Switch
                      checked={round.show_leaderboard}
                      onCheckedChange={(checked) => updateRound(index, { show_leaderboard: checked })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
