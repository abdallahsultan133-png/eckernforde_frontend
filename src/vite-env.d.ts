/// <reference types="vite/client" />

declare module 'qrcode.react' {
    import React from 'react';
    export interface QRCodeSVGProps {
        value: string;
        size?: number;
        level?: 'L' | 'M' | 'Q' | 'H';
        includeMargin?: boolean;
        className?: string;
    }
    export const QRCodeSVG: React.FC<QRCodeSVGProps>;
    export const QRCodeCanvas: React.FC<QRCodeSVGProps>;
}
