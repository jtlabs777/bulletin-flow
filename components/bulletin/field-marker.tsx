'use client'

interface FieldMarkerProps {
    x: number
    y: number
    width: number
    height: number
    label: string
}

export default function FieldMarker({ x, y, width, height, label }: FieldMarkerProps) {
    return (
        <div
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
            }}
        >
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {label}
            </div>
        </div>
    )
}
