export default function Loading(){
    return(
        <div className="w-full max-w-sm mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg w-1/2 animate-pulse"></div>
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="space-y-3">
                    <div className="h-4 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg w-4/5 animate-pulse"></div>
                </div>

                {/* Footer Action Skeleton */}
                <div className="flex gap-3 pt-4">
                    <div className="flex-1 h-10 bg-linear-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse"></div>
                    <div className="flex-1 h-10 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                </div>
            </div>
        </div>
    )
}

export function Loading2(){
    return(
        <div className="flex items-center justify-center min-h-96 py-12">
            <div className="text-center space-y-4">
                {/* Spinner Container */}
                <div className="inline-flex items-center justify-center">
                    <div className="relative w-16 h-16">
                        {/* Outer rotating circle */}
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400 animate-spin"></div>
                        
                        {/* Inner rotating circle - opposite direction */}
                        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-600 border-l-blue-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                        
                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-800">Chargement...</p>
                    <p className="text-sm text-gray-500">Veuillez patienter</p>
                </div>

                {/* Progress Bar */}
                <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full animate-pulse" style={{width: '65%'}}></div>
                </div>
            </div>
        </div>
    )
}