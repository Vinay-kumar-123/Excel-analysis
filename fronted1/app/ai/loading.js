export default function AiLoading() {
  return (
    <div className="max-w-6xl mx-auto mt-20 p-4 md:p-8 animate-pulse">
      <div className="h-44 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-3xl mb-8"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="h-28 bg-gray-200 rounded-2xl"></div>
        <div className="h-28 bg-gray-200 rounded-2xl"></div>
        <div className="h-28 bg-gray-200 rounded-2xl"></div>
        <div className="h-28 bg-gray-200 rounded-2xl"></div>
      </div>
      <div className="h-16 bg-gray-200 rounded-2xl"></div>
    </div>
  );
}
