export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pt-24">
      <div className="w-16 h-16 relative flex items-center justify-center mb-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg animate-pulse absolute"></div>
      </div>
      <h2 className="text-base font-semibold text-gray-800">Loading Section...</h2>
      <p className="text-xs text-gray-500 mt-1">Preparing datasets and studio environment</p>
    </div>
  );
}
