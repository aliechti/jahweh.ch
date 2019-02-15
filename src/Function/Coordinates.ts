export interface OffsetCoordinates {
    x: number;
    y: number;
}

export interface AxialCoordinates {
    q: number;
    r: number;
}

export interface CubeCoordinates {
    x: number;
    y: number;
    z: number;
}

export interface PixelCoordinates {
    x: number;
    y: number;
}

export type AxialMap<V> = Map<number, Map<number, V>>;

export function offsetToAxial(offset: OffsetCoordinates) {
    const cube = offsetToCube(offset);
    return cubeToAxial(cube);
}

export function axialToCube(axial: AxialCoordinates): CubeCoordinates {
    const x = axial.q;
    const z = axial.r;
    const y = -x - z;
    return {x, y, z};
}

export function cubeToAxial(cube: CubeCoordinates): AxialCoordinates {
    const q = cube.x;
    const r = cube.z;
    return {q, r};
}

export function cubeToOffset(cube: CubeCoordinates) {
    const x = cube.x;
    const y = cube.z + (cube.x - (cube.x & 1)) / 2;
    return {x, y};
}

export function offsetToCube(offset: OffsetCoordinates) {
    const x = offset.x;
    const z = offset.y - (offset.x - (offset.x & 1)) / 2;
    const y = -x - z;
    return {x, y, z};
}

export function axialToPixel(axial: AxialCoordinates, radius: number): PixelCoordinates {
    const x = radius * (3 / 2 * axial.q);
    const y = radius * (Math.sqrt(3) / 2 * axial.q + Math.sqrt(3) * axial.r);
    return {x, y};
}

export function offsetToPixel(offset: OffsetCoordinates, radius: number): PixelCoordinates {
    const x = radius * 3 / 2 * offset.x;
    const y = radius * Math.sqrt(3) * (offset.y + 0.5 * (offset.x & 1));
    return {x, y};
}
