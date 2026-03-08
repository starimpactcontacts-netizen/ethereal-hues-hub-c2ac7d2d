import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MobileRadioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export default function MobileRadioSheet({ open, onOpenChange, children }: MobileRadioSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl px-0 pt-0 pb-0 overflow-hidden flex flex-col">
        <VisuallyHidden><SheetTitle>Radio Player</SheetTitle></VisuallyHidden>
        {/* Drag handle */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
