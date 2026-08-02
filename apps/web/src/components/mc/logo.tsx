import { cn } from "cnfast";

export function LaunchKeyhole({ className, sky }: { className?: string; sky?: boolean }) {
  return (
    <img
      src={sky ? "/brand/launch-keyhole-sky.svg" : "/brand/launch-keyhole.svg"}
      alt="Mission Control"
      className={cn("size-10", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-[max] font-black tracking-wide text-[var(--color-mocha-text)]", className)}
      style={{ fontWeight: 900 }}
    >
      Mission Control
    </span>
  );
}

export function LogoLockup({ className, sky }: { className?: string; sky?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LaunchKeyhole sky={sky} className="size-11" />
      <Wordmark className="text-xl" />
    </div>
  );
}
