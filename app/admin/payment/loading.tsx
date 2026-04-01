export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-96 py-12">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600">Chargement des paiements...</p>
      </div>
    </div>
  )
}
