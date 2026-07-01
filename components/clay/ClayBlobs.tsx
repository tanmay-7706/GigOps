/**
 * Ambient floating clay blobs — the "world lighting" behind the glass-clay UI.
 * Fixed, non-interactive, behind everything. Colors show through translucent cards.
 */
export function ClayBlobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-clay-blob absolute -left-[10%] -top-[10%] h-[60vh] w-[60vh] rounded-full bg-clay-accent/15 blur-3xl" />
      <div className="animate-clay-blob animation-delay-2000 absolute -right-[12%] top-[15%] h-[55vh] w-[55vh] rounded-full bg-clay-accent-alt/12 blur-3xl" />
      <div className="animate-clay-blob animation-delay-4000 absolute bottom-[-10%] left-[20%] h-[50vh] w-[50vh] rounded-full bg-clay-blue/12 blur-3xl" />
      <div className="animate-clay-float hidden h-[40vh] w-[40vh] rounded-full bg-clay-success/10 blur-3xl lg:absolute lg:bottom-[5%] lg:right-[10%] lg:block" />
    </div>
  );
}
