import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  figure: any;
  className?: string;
  height?: number;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({ figure, className = '', height = 350 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !figure || !figure.data) return;

    const layout = {
      ...figure.layout,
      autosize: true,
      height: height,
      margin: figure.layout?.margin || { l: 40, r: 20, t: 40, b: 40 },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(containerRef.current, figure.data, layout, config);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [figure, height]);

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div ref={containerRef} style={{ width: '100%', minHeight: `${height}px` }} />
    </div>
  );
};
