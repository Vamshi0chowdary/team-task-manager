const Toast = ({ message, type = 'success' }) => {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-rose-500'
      }`}
    >
      {message}
    </div>
  );
};

export default Toast;
