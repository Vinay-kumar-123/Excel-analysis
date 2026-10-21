export default function UploadLoading() {
  return (
    <div className="max-w-5xl mx-auto mt-20 p-8 animate-pulse">
      <div className="text-center space-y-2 mb-8">
        <div className="h-8 bg-gray-200 rounded-lg w-56 mx-auto"></div>
        <div className="h-4 bg-gray-100 rounded w-96 mx-auto"></div>
      </div>
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 bg-white flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="h-5 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-100 rounded w-64"></div>
      </div>
    </div>
  );
}
