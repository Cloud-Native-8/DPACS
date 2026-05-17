export default function ModalShell({ children, maxWidth = "max-w-5xl", onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className={`max-h-[86vh] w-full ${maxWidth} overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20`}
      >
        {children}
      </section>
    </div>
  );
}
