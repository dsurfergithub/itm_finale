import { CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function LogView() {
  const { state } = useStore();

  return (
    <div className="pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] px-4 max-w-2xl mx-auto space-y-6 w-full animate-in slide-in-from-bottom-8 duration-500">
      
      <section className="mb-8">
        <div className="bg-surface-container p-4 border-2 border-primary hard-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-primary">ESTADO ACTUAL</span>
            <span className="text-sm font-bold text-tertiary">ENCRIPTADO</span>
          </div>
          <div className="h-4 bg-surface flex gap-1 p-0.5 border border-outline-variant">
             {[...Array(10)].map((_, i) => (
                <div key={i} className={`flex-1 ${i < Math.min(10, state.logs.length) ? 'bg-tertiary' : 'bg-tertiary-container/30'}`} />
             ))}
          </div>
          <p className="text-xs font-bold mt-3 text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            SUPERVISANDO ARCHIVE_DATA...
          </p>
        </div>
      </section>

      <div className="space-y-4">
        {state.logs.map((log) => (
          <article 
            key={log.id} 
            className={`bg-black border-2 p-4 hard-shadow hover:translate-x-1 transition-transform cursor-default
              ${log.passed ? 'border-white' : 'border-error'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-bold text-white uppercase">{log.name}</h2>
                <span className="text-xs text-on-surface-variant font-mono">{log.timestamp}</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold tabular-nums block ${log.passed ? 'text-tertiary mission-passed-glow' : 'text-error mission-failed-glow'}`}>
                  {log.passed ? '+' : ''}{log.points}
                </span>
                <span className={`text-xs font-bold uppercase ${log.passed ? 'text-tertiary' : 'text-error'}`}>
                  {log.type}
                </span>
              </div>
            </div>
            
            <div className={`border-t pt-2 mt-2 flex justify-between items-center ${log.passed ? 'border-outline-variant' : 'border-error/50'}`}>
              <span className={`text-lg font-black italic tracking-tighter uppercase ${log.passed ? 'text-tertiary' : 'text-error'}`}>
                {log.passed ? 'MISIÓN COMPLETADA' : 'MISIÓN FALLIDA'}
              </span>
              {log.passed ? (
                <CheckCircle2 className="text-tertiary" size={24} />
              ) : (
                <XCircle className="text-error" size={24} />
              )}
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}
