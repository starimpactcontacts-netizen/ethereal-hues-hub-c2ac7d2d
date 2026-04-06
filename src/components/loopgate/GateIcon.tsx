import { HTMLAttributes } from 'react';
import loopgateLogo from '@/assets/loopgate-logo.png';

/**
 * Loopgate brand icon — uses the official PNG logo.
 * Renders as an img element. Use className for sizing.
 */
export default function GateIcon(props: HTMLAttributes<HTMLImageElement> & { size?: number }) {
  const { size = 24, className, style, ...rest } = props;

  return (
    <img
      src={loopgateLogo}
      alt="Loopgate"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      draggable={false}
      {...rest}
    />
  );
}
