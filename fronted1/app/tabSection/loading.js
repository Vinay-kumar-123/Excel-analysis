export default function TabSectionLoading() {
  return (
    <div className="max-w-7xl mx-auto mt-20 p-4 md:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-48"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 bg-gray-200 rounded-xl w-32"></div>
          <div className="h-9 bg-purple-200 rounded-xl w-28"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex justify-center mb-6">
        <div className="h-12 bg-gray-200 rounded-2xl w-96"></div>
      </div>

      {/* Controls Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="h-4 bg-gray-200 rounded w-44 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-10 bg-gray-100 rounded-lg"></div>
          <div className="h-10 bg-gray-100 rounded-lg"></div>
          <div className="h-10 bg-gray-100 rounded-lg"></div>
          <div className="h-10 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* Chart Canvas Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 h-[440px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-medium">Initializing Visualization Engine...</p>
        </div>
      </div>
    </div>
  );
}
