export default function GlobalSpinner({ message = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
}