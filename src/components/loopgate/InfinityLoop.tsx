import { cn } from "@/lib/utils";

interface InfinityLoopProps {
  className?: string;
  size?: number;
}

export function InfinityLoop({ className, size = 20 }: InfinityLoopProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-amber-400", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.178 8c2.453 0 4.322 1.843 4.322 4s-1.869 4-4.322 4c-1.454 0-2.768-.674-3.678-1.736L12 12l-2.5 2.264C8.59 15.326 7.276 16 5.822 16 3.369 16 1.5 14.157 1.5 12s1.869-4 4.322-4c1.454 0 2.768.674 3.678 1.736L12 12l2.5-2.264C15.41 8.674 16.724 8 18.178 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default InfinityLoop;
