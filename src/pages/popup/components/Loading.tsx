export function Loading() {
    return (
        <div className="w-160 h-145 bg-white flex items-center justify-center overflow-hidden">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                <div className="text-gray-600 text-sm font-medium">Загрузка...</div>
            </div>
        </div>
    );
}
