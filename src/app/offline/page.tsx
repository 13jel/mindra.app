export default function OfflinePage() {
  return (
    <section className="px-4 pt-12 text-center">
      <h1 className="text-2xl font-semibold">Offline</h1>
      <p className="mt-3 text-fg-muted">
        Du verkar vara offline. Försök igen när du är ansluten.
      </p>
      <p className="mt-1 text-fg-muted text-sm">
        You appear to be offline. Try again when connected.
      </p>
    </section>
  );
}