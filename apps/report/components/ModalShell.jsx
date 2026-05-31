import PropTypes from "prop-types";

export default function ModalShell({ children, maxWidth = "max-w-5xl", onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/40"
        onClick={() => onClose?.()}
      />
      <section
        className={`relative z-10 max-h-[86vh] w-full ${maxWidth} overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20`}
      >
        {children}
      </section>
    </div>
  );
}

ModalShell.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string,
  onClose: PropTypes.func,
};
