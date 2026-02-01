import {useEffect, useRef, useState} from 'react';

interface ColorPickerProps {
    label: string;
    description: string;
    value: string;
    onChange: (color: string) => void;
}

interface HSB {
    h: number;
    s: number;
    b: number;
}

function hexToHsb(hex: string): HSB {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    let h = 0;
    if (max !== min) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {h: h * 360, s: s * 100, b: v * 100};
}

function hsbToHex(hsb: HSB): string {
    const s = hsb.s / 100;
    const b = hsb.b / 100;

    const v = b * 255;
    const sv = s * v;

    const h = hsb.h / 60;
    const i = Math.floor(h);
    const f = h - i;
    const p = v - sv;
    const q = v - sv * f;
    const t = v - sv * (1 - f);

    let r: number, g: number, bl: number;

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            bl = p;
            break;
        case 1:
            r = q;
            g = v;
            bl = p;
            break;
        case 2:
            r = p;
            g = v;
            bl = t;
            break;
        case 3:
            r = p;
            g = q;
            bl = v;
            break;
        case 4:
            r = t;
            g = p;
            bl = v;
            break;
        default:
            r = v;
            g = p;
            bl = q;
            break;
    }

    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function hsbToRgb(hsb: HSB): { r: number; g: number; b: number } {
    const s = hsb.s / 100;
    const b = hsb.b / 100;

    const v = b * 255;
    const sv = s * v;

    const h = hsb.h / 60;
    const i = Math.floor(h);
    const f = h - i;
    const p = v - sv;
    const q = v - sv * f;
    const t = v - sv * (1 - f);

    let r: number, g: number, bl: number;

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            bl = p;
            break;
        case 1:
            r = q;
            g = v;
            bl = p;
            break;
        case 2:
            r = p;
            g = v;
            bl = t;
            break;
        case 3:
            r = p;
            g = q;
            bl = v;
            break;
        case 4:
            r = t;
            g = p;
            bl = v;
            break;
        default:
            r = v;
            g = p;
            bl = q;
            break;
    }

    return {r: Math.round(r), g: Math.round(g), b: Math.round(bl)};
}

const PRESET_COLORS = [
    '#FF6B35', '#F7931E', '#FFC107', '#FFEB3B', '#CDDC39',
    '#8BC34A', '#4CAF50', '#009688', '#00BCD4', '#03A9F4',
    '#2196F3', '#3F51B5', '#673AB7', '#9C27B0', '#E91E63',
    '#F44336', '#FFFFFF', '#9E9E9E', '#607D8B', '#000000',
    '#27AE60', '#2C3E50', '#34495E', '#E74C3C', '#9B59B6',
    '#3498DB', '#1ABC9C', '#F39C12', '#D35400', '#C0392B',
];

export default function ColorPicker({label, description, value, onChange}: ColorPickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [hsb, setHsb] = useState<HSB>(() => hexToHsb(value));
    const containerRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLDivElement>(null);
    const saturationRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        setHsb(hexToHsb(value));
    }, [value]);

    useEffect(() => {
        if (!showPicker) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                toggleButtonRef.current &&
                !toggleButtonRef.current.contains(target)
            ) {
                setShowPicker(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showPicker]);

    const handleSaturationChange = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!saturationRef.current) return;

        const rect = saturationRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));

        const newHsb = {...hsb, s: x * 100, b: y * 100};
        setHsb(newHsb);
        onChange(hsbToHex(newHsb));
    };

    const startDrag = () => {
        isDragging.current = true;
    };

    const stopDrag = () => {
        isDragging.current = false;
    };

    const onDrag = (event: MouseEvent) => {
        if (!isDragging.current || !saturationRef.current) return;

        const rect = saturationRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));

        const newHsb = {...hsb, s: x * 100, b: y * 100};
        setHsb(newHsb);
        onChange(hsbToHex(newHsb));
    };

    useEffect(() => {
        if (isDragging.current) {
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            return () => {
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
            };
        }
    }, [hsb, isDragging.current]);

    const handleHueChange = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const newHsb = {...hsb, h: x * 360};
        setHsb(newHsb);
        onChange(hsbToHex(newHsb));
    };

    const {r, g: gVal, b: bVal} = hsbToRgb(hsb);

    return (
        <div className="mb-4 w-full">
            <div className="mb-2">
                <label className="block font-medium mb-1" style={{color: 'var(--text-primary)'}}>
                    {label}
                </label>
                <span className="text-sm" style={{color: 'var(--text-secondary)'}}>
                    {description}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {/* Color button */}
                <div className="relative">
                    <div
                        ref={toggleButtonRef}
                        onClick={() => setShowPicker(!showPicker)}
                        className="w-[50px] h-[40px] rounded cursor-pointer shadow-sm"
                        style={{
                            backgroundColor: value,
                            border: '2px solid var(--border-color)',
                        }}
                    />
                    {showPicker && (
                        <div
                            ref={containerRef}
                            className="absolute top-[44px] left-0 z-[1000] bg-white rounded-lg shadow-lg p-3 w-[220px]"
                            style={{backgroundColor: 'var(--card-bg)'}}
                        >
                            {/* Close button */}
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>
                                    Выберите цвет
                                </span>
                                <button
                                    onClick={() => setShowPicker(false)}
                                    className="text-xl cursor-pointer p-1 leading-none hover:opacity-70"
                                    style={{color: 'var(--text-secondary)'}}
                                    title="Закрыть (Esc)"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Saturation-Brightness box */}
                            <div
                                ref={saturationRef}
                                className="relative w-full h-[120px] rounded cursor-crosshair mb-3 overflow-hidden"
                                onMouseDown={(e) => {
                                    handleSaturationChange(e);
                                    startDrag();
                                }}
                                style={{
                                    backgroundColor: `hsl(${hsb.h}, 100%, 50%)`,
                                    border: '1px solid var(--border-color)',
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"/>
                                <div
                                    className="absolute w-[10px] h-[10px] rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{
                                        left: `${hsb.s}%`,
                                        top: `${100 - hsb.b}%`,
                                        backgroundColor: value,
                                    }}
                                />
                            </div>

                            {/* Hue slider */}
                            <div
                                className="relative w-full h-[12px] rounded cursor-pointer mb-3"
                                onMouseDown={handleHueChange}
                                style={{
                                    background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                                    border: '1px solid var(--border-color)',
                                }}
                            >
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-[12px] h-[16px] rounded shadow"
                                    style={{
                                        left: `calc(${hsb.h / 360 * 100}% - 6px)`,
                                        backgroundColor: value,
                                        border: '2px solid white',
                                    }}
                                />
                            </div>

                            {/* RGB Inputs */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={r.toString()}
                                        readOnly
                                        className="w-full text-xs p-1 text-center rounded border bg-white"
                                        style={{
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <span className="block text-[10px] text-center text-gray-500">R</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={gVal.toString()}
                                        readOnly
                                        className="w-full text-xs p-1 text-center rounded border bg-white"
                                        style={{
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <span className="block text-[10px] text-center text-gray-500">G</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={bVal.toString()}
                                        readOnly
                                        className="w-full text-xs p-1 text-center rounded border bg-white"
                                        style={{
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <span className="block text-[10px] text-center text-gray-500">B</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={value.toUpperCase()}
                                        readOnly
                                        className="w-full text-xs p-1 text-center rounded border bg-white font-mono"
                                        style={{
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <span className="block text-[10px] text-center text-gray-500">HEX</span>
                                </div>
                            </div>

                            {/* Preset colors */}
                            <div className="flex flex-wrap gap-1">
                                {PRESET_COLORS.map((color) => (
                                    <div
                                        key={color}
                                        onClick={() => {
                                            setHsb(hexToHsb(color));
                                            onChange(color);
                                        }}
                                        className="w-[20px] h-[20px] rounded cursor-pointer transition-transform hover:scale-110"
                                        style={{
                                            backgroundColor: color,
                                            border: color === '#FFFFFF' ? '1px solid var(--border-color)' : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hex input */}
                <div className="flex-1">
                    <input
                        type="text"
                        value={value.toUpperCase()}
                        onChange={(e) => {
                            const hex = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                                if (hex.length === 7) {
                                    setHsb(hexToHsb(hex));
                                    onChange(hex);
                                }
                            }
                        }}
                        placeholder="#000000"
                        className="w-full px-3 py-2 rounded border bg-white text-sm font-mono uppercase"
                        style={{
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>

                {/* Quick preset colors */}
                <div className="flex gap-1 flex-wrap max-w-[150px]">
                    {PRESET_COLORS.slice(0, 10).map((color) => (
                        <div
                            key={color}
                            onClick={() => {
                                setHsb(hexToHsb(color));
                                onChange(color);
                            }}
                            className="w-[20px] h-[20px] rounded cursor-pointer transition-transform hover:scale-110"
                            style={{
                                backgroundColor: color,
                                border: color === '#FFFFFF' ? '1px solid var(--border-color)' : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
