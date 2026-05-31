import { useProgress } from '@react-three/drei';

export function LoadingScreen() {
  const { progress } = useProgress();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-base font-medium tracking-wide">Initializing warehouse</p>
      </div>
      <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-2 font-mono">{Math.round(progress)}%</p>
    </div>
  );
}
