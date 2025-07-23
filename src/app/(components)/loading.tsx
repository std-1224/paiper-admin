export default function Loading() {
  // Or a custom loading skeleton component
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}
