import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './WorkoutPlan.css';

export default function WorkoutPlan({ routine }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []); // solo al montar, no en cada chunk del stream

  const handleCopy = () => {
    navigator.clipboard.writeText(routine);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Rutina Semanal</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; line-height: 1.6; color: #111; }
            h1,h2,h3 { color: #111; }
            a { color: #7c3aed; }
          </style>
        </head>
        <body>${ref.current.querySelector('.plan-content').innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="workout-plan" ref={ref}>
      <div className="plan-actions">
        <button className="btn-action" onClick={handleCopy} title="Copiar al portapapeles">
          📋 Copiar
        </button>
        <button className="btn-action" onClick={handlePrint} title="Imprimir rutina">
          🖨️ Imprimir
        </button>
      </div>
      <div className="plan-content">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {routine}
        </ReactMarkdown>
      </div>
    </div>
  );
}
