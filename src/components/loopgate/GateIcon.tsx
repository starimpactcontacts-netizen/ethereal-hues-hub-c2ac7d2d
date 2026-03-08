import { SVGProps } from 'react';

/**
 * Loopgate "Gate" icon — a hexagonal gate shape with inner infinity loop.
 * Replaces generic sparkle/star icons across the platform.
 */
export default function GateIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, width, height, className, ...rest } = props;
  const w = width ?? size;
  const h = height ?? size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      {...rest}
    >
      {/* Outer hexagonal gate */}
      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" />
      {/* Inner infinity loop */}
      <path
        d="M8.5 12C8.5 10.5 9.5 9.5 10.5 9.5C11.5 9.5 12 10.5 12 12C12 10.5 12.5 9.5 13.5 9.5C14.5 9.5 15.5 10.5 15.5 12C15.5 13.5 14.5 14.5 13.5 14.5C12.5 14.5 12 13.5 12 12C12 13.5 11.5 14.5 10.5 14.5C9.5 14.5 8.5 13.5 8.5 12Z"
        strokeWidth={1.6}
      />
    </svg>
  );
}
