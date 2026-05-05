const InlineConfirm = ({ message, onConfirm, onCancel, loading = false }) => {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
      <p className="font-medium">{message}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Loading...' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InlineConfirm;
