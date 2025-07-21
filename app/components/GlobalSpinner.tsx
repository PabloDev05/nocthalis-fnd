export default function GlobalSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="animate-spin h-16 w-16 rounded-full border-t-4 border-b-4 border-purple-500" />
      <p className="mt-4 text-white text-lg">Cargando...</p>
    </div>
  );
}
