export function SegmentedProgressBar({ 
  percentage, 
  colorClass, 
  totalSegments = 10 
}: { 
  percentage: number; 
  colorClass: string; 
  totalSegments?: number;
}) {
  const filledSegments = Math.round((percentage / 100) * totalSegments);
  
  return (
    <div className="h-6 w-full bg-surface-container-highest border-2 border-black flex gap-0.5 p-0.5">
      {Array.from({ length: totalSegments }).map((_, i) => (
        <div 
          key={i} 
          className={`h-full flex-1 border-r-2 border-black last:border-r-0 ${
            i < filledSegments ? colorClass : 'bg-surface-container-highest'
          }`}
        />
      ))}
    </div>
  );
}
