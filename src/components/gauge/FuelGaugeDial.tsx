import React, { useRef, useState, useEffect } from 'react';
import { Fuel, Camera, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { GAUGE_FRACTIONS, getLitersFromGauge, getGaugeLabel } from '../../services/fuelCalculator';

interface FuelGaugeDialProps {
  value: number; // 0.0 to 1.0
  onChange?: (val: number) => void;
  tankCapacityL?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  sublabel?: string;
  photoUrl?: string;
  onPhotoChange?: (dataUrl: string) => void;
  accentColor?: 'emerald' | 'amber' | 'blue' | 'rose';
}

export const FuelGaugeDial: React.FC<FuelGaugeDialProps> = ({
  value,
  onChange,
  tankCapacityL = 400,
  readOnly = false,
  size = 'md',
  label,
  sublabel,
  photoUrl,
  onPhotoChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gaugeRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clamped value between 0 and 1
  const clampedVal = Math.max(0, Math.min(1, Number(value) || 0));
  const liters = getLitersFromGauge(clampedVal, tankCapacityL);
  const gaugeLabel = getGaugeLabel(clampedVal);
  const percentage = Math.round(clampedVal * 100);

  // Arc angles: 
  // Start at -135 degrees (Empty, left bottom) to +135 degrees (Full, right bottom)
  // Total span = 270 degrees
  const START_ANGLE = -135;
  const END_ANGLE = 135;
  const ANGLE_SPAN = END_ANGLE - START_ANGLE; // 270 deg
  const needleAngle = START_ANGLE + clampedVal * ANGLE_SPAN;

  // Is low fuel (<= 12.5% / 1/8th)
  const isLowFuel = clampedVal <= 0.125;

  // Handle angle from mouse / touch on gauge
  const handlePointerInteraction = (clientX: number, clientY: number) => {
    if (readOnly || !onChange || !gaugeRef.current) return;
    const rect = gaugeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI; // -180 to 180
    // Adjust degrees so that bottom-center is ~90 deg, left is ~180/-180, top is -90
    // We want -135 (bottom-left) to +135 (bottom-right) passing through -90 (top)
    // Rotate coordinate system so top (-90) is 0
    let rot = deg + 90;
    if (rot > 180) rot -= 360; // -180 to 180 relative to top

    // Map -135 to 135
    if (rot < -135) rot = -135;
    if (rot > 135) rot = 135;

    const normalized = (rot - START_ANGLE) / ANGLE_SPAN;
    const clamped = Math.max(0, Math.min(1, normalized));
    // Round to nearest 0.005 for smooth feeling
    const rounded = Math.round(clamped * 200) / 200;
    onChange(rounded);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly || !onChange) return;
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Dimensions based on size
  const svgSize = size === 'sm' ? 180 : size === 'lg' ? 320 : 250;
  const strokeWidth = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const radius = svgSize / 2 - strokeWidth - 10;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  // Polar to cartesian helper
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // Describe arc SVG path
  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoChange) return;

    // Read and compress image locally offline via canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onPhotoChange(dataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur select-none">
      {/* Header labels */}
      {(label || sublabel) && (
        <div className="text-center mb-2">
          {label && <h4 className="font-semibold text-slate-100 text-sm tracking-wide">{label}</h4>}
          {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
        </div>
      )}

      {/* Main Gauge Cluster SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          ref={gaugeRef}
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className={`cursor-${readOnly ? 'default' : 'grab active:cursor-grabbing'} transition-transform`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <filter id={`dial-glow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id={`gaugeGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="15%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <radialGradient id={`hubGrad-${size}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>

          {/* Dial Background Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 6}
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="3"
          />

          {/* Background Track Arc */}
          <path
            d={describeArc(cx, cy, radius, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Red Reserve Danger Zone Arc (0% to 12.5%) */}
          <path
            d={describeArc(cx, cy, radius, START_ANGLE, START_ANGLE + 0.125 * ANGLE_SPAN)}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Active Level Arc */}
          {clampedVal > 0.01 && (
            <path
              d={describeArc(cx, cy, radius, START_ANGLE, START_ANGLE + clampedVal * ANGLE_SPAN)}
              fill="none"
              stroke={`url(#gaugeGradient-${size})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#dial-glow-${size})`}
            />
          )}

          {/* Graduated Ticks and Major Marks */}
          {GAUGE_FRACTIONS.map((item) => {
            const angle = START_ANGLE + item.value * ANGLE_SPAN;
            const isMajor = item.value === 0 || item.value === 0.5 || item.value === 1.0;
            const isDanger = item.value <= 0.125;
            const tickLength = isMajor ? strokeWidth + 6 : strokeWidth - 2;
            const outerPoint = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 1, angle);
            const innerPoint = polarToCartesian(cx, cy, radius + strokeWidth / 2 - tickLength, angle);
            const textPoint = polarToCartesian(cx, cy, radius - strokeWidth - (size === 'sm' ? 8 : 14), angle);

            return (
              <g key={item.label}>
                <line
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke={isDanger ? '#ef4444' : isMajor ? '#f8fafc' : '#64748b'}
                  strokeWidth={isMajor ? 2.5 : 1.5}
                  strokeLinecap="round"
                />
                {/* Labels: E, 1/4, 1/2, 3/4, F */}
                {(isMajor || item.value === 0.25 || item.value === 0.75) && (
                  <text
                    x={textPoint.x}
                    y={textPoint.y + (size === 'sm' ? 3 : 4)}
                    fill={isDanger ? '#ef4444' : item.value === 1 ? '#38bdf8' : '#cbd5e1'}
                    fontSize={size === 'sm' ? (isMajor ? 11 : 9) : isMajor ? 14 : 11}
                    fontWeight={isMajor ? '800' : '600'}
                    fontFamily="ui-monospace, monospace"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Needle Line and Tip */}
          {(() => {
            const needleLen = radius - 4;
            const needleTip = polarToCartesian(cx, cy, needleLen, needleAngle);
            const needleTail = polarToCartesian(cx, cy, -14, needleAngle);
            const needleColor = isLowFuel ? '#ef4444' : '#10b981';

            return (
              <g className="transition-all duration-75">
                {/* Needle shadow */}
                <line
                  x1={needleTail.x + 2}
                  y1={needleTail.y + 2}
                  x2={needleTip.x + 2}
                  y2={needleTip.y + 2}
                  stroke="#000000"
                  strokeWidth={size === 'sm' ? 3 : 4}
                  strokeLinecap="round"
                  opacity="0.6"
                />
                {/* Glowing Needle body */}
                <line
                  x1={needleTail.x}
                  y1={needleTail.y}
                  x2={needleTip.x}
                  y2={needleTip.y}
                  stroke={needleColor}
                  strokeWidth={size === 'sm' ? 3 : 4}
                  strokeLinecap="round"
                  filter={`url(#dial-glow-${size})`}
                />
                {/* Metallic Center Hub */}
                <circle cx={cx} cy={cy} r={size === 'sm' ? 12 : 16} fill={`url(#hubGrad-${size})`} stroke="#475569" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={size === 'sm' ? 4 : 6} fill={needleColor} />
              </g>
            );
          })()}

          {/* Center Fuel Pump Icon & Reserve Indicator */}
          <g transform={`translate(${cx - 10}, ${cy + (size === 'sm' ? 24 : 36)})`}>
            <Fuel
              size={20}
              className={`${
                isLowFuel
                  ? 'text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  : 'text-slate-400'
              }`}
            />
          </g>
        </svg>

        {/* Low Fuel Warning Overlay Badge if <= 12.5% */}
        {isLowFuel && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] text-rose-300 animate-pulse font-medium">
            <AlertTriangle size={11} />
            <span>Low Reserve</span>
          </div>
        )}
      </div>

      {/* Numerical Telemetry Readout */}
      <div className="mt-1 flex flex-col items-center">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            {gaugeLabel}
          </span>
          <span className="text-sm font-semibold text-slate-400">
            ({percentage}%)
          </span>
        </div>

        <div className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full mt-1">
          {liters} L <span className="text-slate-400">/ {tankCapacityL} L tank</span>
        </div>
      </div>

      {/* Preset Dial Buttons (Quick Tap) */}
      {!readOnly && onChange && (
        <div className="mt-3 w-full">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
            <span>Quick Presets:</span>
            <span>Tap needle or dial to adjust</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[
              { val: 0.0, txt: 'E' },
              { val: 0.25, txt: '1/4' },
              { val: 0.5, txt: '1/2' },
              { val: 0.75, txt: '3/4' },
              { val: 1.0, txt: 'Full' },
            ].map((p) => {
              const active = Math.abs(clampedVal - p.val) < 0.03;
              return (
                <button
                  key={p.txt}
                  type="button"
                  onClick={() => onChange(p.val)}
                  className={`py-1 rounded text-xs font-bold transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {p.txt}
                </button>
              );
            })}
          </div>

          {/* Stepper controls */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, clampedVal - 0.025))}
              className="flex-1 py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 active:scale-95 transition"
              title="Fine decrease (-2.5%)"
            >
              -2.5%
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={clampedVal}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="flex-2 accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <button
              type="button"
              onClick={() => onChange(Math.min(1, clampedVal + 0.025))}
              className="flex-1 py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 active:scale-95 transition"
              title="Fine increase (+2.5%)"
            >
              +2.5%
            </button>
          </div>
        </div>
      )}

      {/* Verification Photo Snapshot (Offline camera / upload) */}
      {(onPhotoChange || photoUrl) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {photoUrl ? (
              <div className="relative group">
                <img
                  src={photoUrl}
                  alt="Dashboard Gauge Snapshot"
                  className="w-10 h-10 object-cover rounded-lg border border-emerald-500/50 shadow"
                />
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                  <Check size={10} />
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                <Camera size={18} />
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200">
                {photoUrl ? 'Dashboard Verified' : 'Gauge Photo (Optional)'}
              </p>
              <p className="text-[10px] text-slate-400">
                {photoUrl ? 'Tap to replace photo' : 'Snap needle proof'}
              </p>
            </div>
          </div>

          {!readOnly && onPhotoChange && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Camera size={13} />
                <span>{photoUrl ? 'Change' : 'Snap'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
