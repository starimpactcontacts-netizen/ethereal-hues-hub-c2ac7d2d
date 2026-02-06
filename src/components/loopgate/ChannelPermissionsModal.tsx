import { useState, useEffect } from "react";
import { Lock, Unlock, Eye, MessageSquare, Shield, Crown, Hash, Bot, ShieldCheck, BarChart3, Calendar, Bell, BookOpen, Send, X, Plus, Trash2, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrewChannel } from "@/hooks/useCrewChannels";
import { useUnitBot } from "@/hooks/useUnitBot";
import { toast } from "sonner";
import { LoopedX } from "./LoopedX";

interface ChannelPermissionsModalProps {
  channel: CrewChannel;
  crewId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (channelId: string, updates: Partial<CrewChannel>) => Promise<boolean>;
  tiers?: { id: string; name: string; tier_order: number; color: string; icon: string }[];
  botName?: string;
  botAvatarUrl?: string;
  onSaveBotSettings?: (name: string, avatarUrl: string) => Promise<void>;
}

type CommandType = "embed" | "poll" | "event" | "reminder" | "rules" | null;

export default function ChannelPermissionsModal({
  channel,
  crewId,
  isOpen,
  onClose,
  onSave,
  tiers = [],
  botName = "Unit Bot",
  botAvatarUrl = "",
  onSaveBotSettings,
}: ChannelPermissionsModalProps) {
  const [isLocked, setIsLocked] = useState(channel.is_locked);
  const [isEditorOnly, setIsEditorOnly] = useState(channel.is_editor_only);
  const [minTierOrder, setMinTierOrder] = useState(channel.min_tier_order);
  const [localBotName, setLocalBotName] = useState(botName);
  const [localBotAvatar, setLocalBotAvatar] = useState(botAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showBotIdentity, setShowBotIdentity] = useState(false);
  const [activeCommand, setActiveCommand] = useState<CommandType>(null);

  // Bot command state
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedBody, setEmbedBody] = useState("");
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("24");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [rules, setRules] = useState(["", ""]);

  const { createPoll, createEvent, createReminder, postRules, postEmbed, sending } = useUnitBot(crewId, channel.id, botName);

  useEffect(() => {
    setIsLocked(channel.is_locked);
    setIsEditorOnly(channel.is_editor_only);
    setMinTierOrder(channel.min_tier_order);
    setLocalBotName(botName);
    setLocalBotAvatar(botAvatarUrl);
  }, [channel, botName, botAvatarUrl]);

  const handleSaveSettings = async () => {
    setSaving(true);
    const success = await onSave(channel.id, {
      is_locked: isLocked,
      is_editor_only: isEditorOnly,
      min_tier_order: minTierOrder,
    });

    if (onSaveBotSettings) {
      await onSaveBotSettings(localBotName.trim() || "Unit Bot", localBotAvatar.trim());
    }

    if (success) {
      toast.success("Channel settings updated");
      onClose();
    }
    setSaving(false);
  };

  const resetCommand = () => {
    setActiveCommand(null);
    setEmbedTitle("");
    setEmbedBody("");
    setPollTitle("");
    setPollOptions(["", ""]);
    setPollDuration("24");
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventTime("");
    setReminderText("");
    setRules(["", ""]);
  };

  const handleEmbed = async () => {
    if (!embedBody.trim()) return;
    await postEmbed(embedTitle, embedBody);
    resetCommand();
  };

  const handlePoll = async () => {
    const valid = pollOptions.filter(o => o.trim());
    if (!pollTitle.trim() || valid.length < 2) return;
    await createPoll(pollTitle.trim(), valid, parseInt(pollDuration));
    resetCommand();
  };

  const handleEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) return;
    await createEvent(eventTitle.trim(), eventDescription.trim(), `${eventDate}T${eventTime}`);
    resetCommand();
  };

  const handleReminder = async () => {
    if (!reminderText.trim()) return;
    await createReminder(reminderText.trim());
    resetCommand();
  };

  const handleRules = async () => {
    const valid = rules.filter(r => r.trim());
    if (valid.length === 0) return;
    await postRules(valid);
    resetCommand();
  };

  const commands = [
    { type: "embed" as CommandType, icon: Send, label: "Embed Message", desc: "Post as the bot" },
    { type: "poll" as CommandType, icon: BarChart3, label: "Create Poll", desc: "Members vote on options" },
    { type: "event" as CommandType, icon: Calendar, label: "Schedule Event", desc: "Set a date & time" },
    { type: "reminder" as CommandType, icon: Bell, label: "Post Reminder", desc: "Send an announcement" },
    { type: "rules" as CommandType, icon: BookOpen, label: "Post Rules", desc: "Share unit guidelines" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-sm">Channel Settings</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {channel.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <LoopedX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* ========== BOT COMMANDS (top, primary) ========== */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {botAvatarUrl ? (
                      <img src={botAvatarUrl} alt="Bot" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide">{botName || "Unit Bot"}</h3>
                    <p className="text-[11px] text-muted-foreground">Officer commands</p>
                  </div>
                </div>

                {!activeCommand ? (
                  <div className="space-y-1">
                    {commands.map((cmd) => (
                      <button
                        key={cmd.type}
                        onClick={() => setActiveCommand(cmd.type)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 transition-colors text-left active:scale-[0.98] touch-manipulation"
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                          <cmd.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cmd.label}</p>
                          <p className="text-[11px] text-muted-foreground">{cmd.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Embed Message Form */}
                    {activeCommand === "embed" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Send className="w-4 h-4 text-primary" /> Embed Message
                          </h3>
                          <button onClick={resetCommand} className="p-1 rounded hover:bg-muted/50">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <Input
                          placeholder="Title (optional)"
                          value={embedTitle}
                          onChange={(e) => setEmbedTitle(e.target.value)}
                          className="text-sm"
                        />
                        <Textarea
                          placeholder="Message body..."
                          value={embedBody}
                          onChange={(e) => setEmbedBody(e.target.value)}
                          className="text-sm min-h-[80px]"
                        />
                        <Button onClick={handleEmbed} disabled={sending || !embedBody.trim()} className="w-full" size="sm">
                          {sending ? "Posting..." : "Post as Bot"}
                        </Button>
                      </>
                    )}

                    {/* Poll Form */}
                    {activeCommand === "poll" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" /> Create Poll
                          </h3>
                          <button onClick={resetCommand} className="p-1 rounded hover:bg-muted/50">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <Input placeholder="Poll question..." value={pollTitle} onChange={(e) => setPollTitle(e.target.value)} className="text-sm" />
                        <div className="space-y-2">
                          {pollOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <Input placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} className="text-sm flex-1" />
                              {pollOptions.length > 2 && (
                                <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 6 && (
                            <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-primary flex items-center gap-1 px-1"><Plus className="w-3 h-3" /> Add option</button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Duration:</span>
                          <select value={pollDuration} onChange={(e) => setPollDuration(e.target.value)} className="bg-muted/30 rounded px-2 py-1 text-xs border border-border">
                            <option value="1">1 hour</option>
                            <option value="6">6 hours</option>
                            <option value="24">24 hours</option>
                            <option value="72">3 days</option>
                            <option value="168">7 days</option>
                          </select>
                        </div>
                        <Button onClick={handlePoll} disabled={sending || !pollTitle.trim() || pollOptions.filter(o => o.trim()).length < 2} className="w-full" size="sm">
                          {sending ? "Creating..." : "Create Poll"}
                        </Button>
                      </>
                    )}

                    {/* Event Form */}
                    {activeCommand === "event" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Schedule Event</h3>
                          <button onClick={resetCommand} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4 text-muted-foreground" /></button>
                        </div>
                        <Input placeholder="Event name..." value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="text-sm" />
                        <Textarea placeholder="Description (optional)..." value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className="text-sm min-h-[60px]" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="text-sm" />
                          <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="text-sm" />
                        </div>
                        <Button onClick={handleEvent} disabled={sending || !eventTitle.trim() || !eventDate || !eventTime} className="w-full" size="sm">
                          {sending ? "Scheduling..." : "Schedule Event"}
                        </Button>
                      </>
                    )}

                    {/* Reminder Form */}
                    {activeCommand === "reminder" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Post Reminder</h3>
                          <button onClick={resetCommand} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4 text-muted-foreground" /></button>
                        </div>
                        <Textarea placeholder="What do you want to remind the unit about?" value={reminderText} onChange={(e) => setReminderText(e.target.value)} className="text-sm min-h-[80px]" />
                        <Button onClick={handleReminder} disabled={sending || !reminderText.trim()} className="w-full" size="sm">
                          {sending ? "Posting..." : "Post Reminder"}
                        </Button>
                      </>
                    )}

                    {/* Rules Form */}
                    {activeCommand === "rules" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Post Rules</h3>
                          <button onClick={resetCommand} className="p-1 rounded hover:bg-muted/50"><X className="w-4 h-4 text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-2">
                          {rules.map((rule, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <Input placeholder={`Rule ${i + 1}`} value={rule} onChange={(e) => { const n = [...rules]; n[i] = e.target.value; setRules(n); }} className="text-sm flex-1" />
                              {rules.length > 1 && (
                                <button onClick={() => setRules(rules.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                          ))}
                          {rules.length < 10 && (
                            <button onClick={() => setRules([...rules, ""])} className="text-xs text-primary flex items-center gap-1 px-1"><Plus className="w-3 h-3" /> Add rule</button>
                          )}
                        </div>
                        <Button onClick={handleRules} disabled={sending || rules.filter(r => r.trim()).length === 0} className="w-full" size="sm">
                          {sending ? "Posting..." : "Post Rules"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ========== BOT IDENTITY (collapsible) ========== */}
              {onSaveBotSettings && (
                <div className="border-t border-border/30 pt-3">
                  <button
                    onClick={() => setShowBotIdentity(!showBotIdentity)}
                    className="w-full flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Bot Identity</span>
                    </div>
                    {showBotIdentity ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  <AnimatePresence>
                    {showBotIdentity && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pt-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Bot Name</Label>
                            <Input placeholder="Unit Bot" value={localBotName} onChange={(e) => setLocalBotName(e.target.value)} maxLength={32} className="bg-muted/50 h-9 text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Bot Avatar URL</Label>
                            <Input placeholder="https://example.com/avatar.png" value={localBotAvatar} onChange={(e) => setLocalBotAvatar(e.target.value)} className="bg-muted/50 h-9 text-sm" />
                          </div>
                          {/* Preview */}
                          <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full ring-2 ring-primary/30 bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                {localBotAvatar ? <img src={localBotAvatar} alt="Bot" className="w-full h-full object-cover" /> : <span className="text-sm">🤖</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-semibold text-primary">{localBotName || "Unit Bot"}</span>
                                <span className="inline-flex items-center gap-0.5 px-1 py-[1px] rounded bg-primary/15 border border-primary/20">
                                  <ShieldCheck className="w-3 h-3 text-primary" />
                                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">BOT</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ========== CHANNEL PERMISSIONS (collapsible) ========== */}
              <div className="border-t border-border/30 pt-3">
                <button
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="w-full flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Channel Permissions</span>
                  </div>
                  {showPermissions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {showPermissions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-3">
                        {/* Lock */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                              {isLocked ? <Lock className="w-4 h-4 text-orange-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Officer-Only Posting</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Only owners and officers can send messages.</p>
                            </div>
                          </div>
                          <Switch checked={isLocked} onCheckedChange={setIsLocked} />
                        </div>

                        {/* Editor Only */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                              <Crown className="w-4 h-4 text-gold" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Editor-Only Access</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Only verified unit editors can see and post.</p>
                            </div>
                          </div>
                          <Switch checked={isEditorOnly} onCheckedChange={setIsEditorOnly} />
                        </div>

                        {/* Min Tier */}
                        {isEditorOnly && tiers.length > 0 && (
                          <div className="pl-12">
                            <p className="text-sm font-medium">Minimum Tier</p>
                            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Only editors at or above this tier.</p>
                            <Select value={String(minTierOrder)} onValueChange={(v) => setMinTierOrder(Number(v))}>
                              <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="Any tier" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Any Tier</SelectItem>
                                {tiers.sort((a, b) => a.tier_order - b.tier_order).map((tier) => (
                                  <SelectItem key={tier.id} value={String(tier.tier_order)}>
                                    <span className="flex items-center gap-2"><span>{tier.icon}</span><span style={{ color: tier.color }}>{tier.name}</span></span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Access Preview */}
                        <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Current Access</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-background border border-border flex items-center gap-1">
                              <Eye className="w-3 h-3" />{isEditorOnly ? "Editors only" : "All members"} can view
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-background border border-border flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />{isLocked ? "Officers only" : isEditorOnly ? "Editors" : "Everyone"} can post
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer - Save Settings */}
            {(showPermissions || showBotIdentity) && (
              <div className="p-4 border-t border-border/50 flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleSaveSettings} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
