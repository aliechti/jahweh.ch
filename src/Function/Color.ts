export function colorToString(color: number): string {
    const hex = color.toString(16);
    const padding = '0'.repeat(6 - hex.length);
    return '#' + padding + hex;
}

export function stringToColor(string: string): number {
    return parseInt(string.replace(/#/, '0x'), 16);
}

export function colorSplit(color: number) {
    const r = (color & 0xff0000) >> 16;
    const g = (color & 0x00ff00) >> 8;
    const b = (color & 0x0000ff);
    return {r, g, b};
}

export function colorConcat(color: { r: number, g: number, b: number }) {
    return (color.r << 16) + (color.g << 8) + color.b;
}

export function colorMultiply(color: number, multiplier: number) {
    const {r, g, b} = colorSplit(color);
    return colorConcat({
        r: Math.min(Math.max(r * multiplier, 0), 255),
        g: Math.min(Math.max(g * multiplier, 0), 255),
        b: Math.min(Math.max(b * multiplier, 0), 255),
    });
}
