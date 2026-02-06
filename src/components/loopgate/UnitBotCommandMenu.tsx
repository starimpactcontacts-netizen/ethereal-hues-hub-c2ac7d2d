import { useState } from "react";
import { Bot, BarChart3, Calendar, Bell, BookOpen, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnitBot } from "@/hooks/useUnitBot";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface UnitBotCommandMenuProps {
  crewId: string;
  channelId: string;
  isOfficer: boolean;
}

type CommandType = "poll" | "event" | "reminder" | "rules" | null;
// Desktop-only state for showing the menu popover

export default function UnitBotCommandMenu({ crewId, channelId, isOfficer }: UnitBotCommandMenuProps) {
  const isMobile = useIsMobile();
  const { createPoll, createEvent, createReminder, postRules, sending } = useUnitBot(crewId, channelId);
  const [activeCommand, setActiveCommand] = useState<CommandType>(null);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);

  // Poll state
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("24");

  // Event state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  // Reminder state
  const [reminderText, setReminderText] = useState("");

  // Rules state
  const [rules, setRules] = useState(["", ""]);

  if (!isOfficer) return null;

  const resetAll = () => {
    setActiveCommand(null);
    setShowDesktopMenu(false);
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

  const handleCreatePoll = async () => {
    const validOptions = pollOptions.filter((o) => o.trim());
    if (!pollTitle.trim() || validOptions.length < 2) return;
    await createPoll(pollTitle.trim(), validOptions, parseInt(pollDuration));
    resetAll();
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) return;
    const dateTime = `${eventDate}T${eventTime}`;
    await createEvent(eventTitle.trim(), eventDescription.trim(), dateTime);
    resetAll();
  };

  const handleCreateReminder = async () => {
    if (!reminderText.trim()) return;
    await createReminder(reminderText.trim());
    resetAll();
  };

  const handlePostRules = async () => {
    const validRules = rules.filter((r) => r.trim());
    if (validRules.length === 0) return;
    await postRules(validRules);
    resetAll();
  };

  const commands = [
    { type: "poll" as CommandType, icon: BarChart3, label: "Create Poll", desc: "Members vote on options" },
    { type: "event" as CommandType, icon: Calendar, label: "Schedule Event", desc: "Set a date & time" },
    { type: "reminder" as CommandType, icon: Bell, label: "Post Reminder", desc: "Send an announcement" },
    { type: "rules" as CommandType, icon: BookOpen, label: "Post Rules", desc: "Share unit guidelines" },
  ];

  const CommandFormContent = () => (
    <div className="p-4 space-y-4">
      {!activeCommand && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Unit Bot</h3>
              <p className="text-[11px] text-muted-foreground">Officer commands</p>
            </div>
          </div>
          <div className="space-y-1">
            {commands.map((cmd) => (
              <button
                key={cmd.type}
                onClick={() => setActiveCommand(cmd.type)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 transition-colors text-left active:scale-[0.98] touch-manipulation"
              >
                <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                  <cmd.icon className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cmd.label}</p>
                  <p className="text-[11px] text-muted-foreground">{cmd.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Poll Form */}
      {activeCommand === "poll" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Create Poll
            </h3>
            <button onClick={() => setActiveCommand(null)} className="p-1 rounded hover:bg-muted/50">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <Input
            placeholder="Poll question..."
            value={pollTitle}
            onChange={(e) => setPollTitle(e.target.value)}
            className="text-sm"
          />
          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  className="text-sm flex-1"
                />
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="text-xs text-primary flex items-center gap-1 px-1"
              >
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <select
              value={pollDuration}
              onChange={(e) => setPollDuration(e.target.value)}
              className="bg-muted/30 rounded px-2 py-1 text-xs border border-border"
            >
              <option value="1">1 hour</option>
              <option value="6">6 hours</option>
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">7 days</option>
            </select>
          </div>
          <Button
            onClick={handleCreatePoll}
            disabled={sending || !pollTitle.trim() || pollOptions.filter(o => o.trim()).length < 2}
            className="w-full"
            size="sm"
          >
            {sending ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      )}

      {/* Event Form */}
      {activeCommand === "event" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Schedule Event
            </h3>
            <button onClick={() => setActiveCommand(null)} className="p-1 rounded hover:bg-muted/50">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <Input
            placeholder="Event name..."
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="Description (optional)..."
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="text-sm min-h-[60px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="text-sm"
            />
            <Input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="text-sm"
            />
          </div>
          <Button
            onClick={handleCreateEvent}
            disabled={sending || !eventTitle.trim() || !eventDate || !eventTime}
            className="w-full"
            size="sm"
          >
            {sending ? "Scheduling..." : "Schedule Event"}
          </Button>
        </div>
      )}

      {/* Reminder Form */}
      {activeCommand === "reminder" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Post Reminder
            </h3>
            <button onClick={() => setActiveCommand(null)} className="p-1 rounded hover:bg-muted/50">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <Textarea
            placeholder="What do you want to remind the unit about?"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            className="text-sm min-h-[80px]"
          />
          <Button
            onClick={handleCreateReminder}
            disabled={sending || !reminderText.trim()}
            className="w-full"
            size="sm"
          >
            {sending ? "Posting..." : "Post Reminder"}
          </Button>
        </div>
      )}

      {/* Rules Form */}
      {activeCommand === "rules" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Post Rules
            </h3>
            <button onClick={() => setActiveCommand(null)} className="p-1 rounded hover:bg-muted/50">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <Input
                  placeholder={`Rule ${i + 1}`}
                  value={rule}
                  onChange={(e) => {
                    const next = [...rules];
                    next[i] = e.target.value;
                    setRules(next);
                  }}
                  className="text-sm flex-1"
                />
                {rules.length > 1 && (
                  <button
                    onClick={() => setRules(rules.filter((_, j) => j !== i))}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {rules.length < 10 && (
              <button
                onClick={() => setRules([...rules, ""])}
                className="text-xs text-primary flex items-center gap-1 px-1"
              >
                <Plus className="w-3 h-3" /> Add rule
              </button>
            )}
          </div>
          <Button
            onClick={handlePostRules}
            disabled={sending || rules.filter(r => r.trim()).length === 0}
            className="w-full"
            size="sm"
          >
            {sending ? "Posting..." : "Post Rules"}
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile: bottom drawer, Desktop: popover-style
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground active:scale-95 touch-manipulation">
            <Bot className="w-5 h-5" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <CommandFormContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (showDesktopMenu) {
            setShowDesktopMenu(false);
            setActiveCommand(null);
          } else {
            setShowDesktopMenu(true);
            setActiveCommand(null);
          }
        }}
        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
        title="Unit Bot Commands"
      >
        <Bot className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {showDesktopMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <CommandFormContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
