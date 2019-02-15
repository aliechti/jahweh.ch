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

export const axialDirections: AxialCoordinates[] = [
    {q: 0, r: -1}, {q: 1, r: -1}, {q: 1, r: 0}, {q: 0, r: 1}, {q: -1, r: 1}, {q: -1, r: 0},
];

export const cubeDirections: CubeCoordinates[] = [
    {x: 0, y: 1, z: -1}, {x: 1, y: 0, z: -1}, {x: 1, y: -1, z: 0},
    {x: 0, y: -1, z: 1}, {x: -1, y: 0, z: 1}, {x: -1, y: 1, z: 0},
];

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

export function axialAdd(...axials: AxialCoordinates[]) {
    const added: AxialCoordinates = {q: 0, r: 0};
    for (const axial of axials) {
        added.q += axial.q;
        added.r += axial.r;
    }
    return added;
}

export function axialMultiply(axial: AxialCoordinates, multiplier: number): AxialCoordinates {
    return {q: axial.q * multiplier, r: axial.r * multiplier};
}

export function axialNeighbor(axial: AxialCoordinates, direction: number): AxialCoordinates {
    return axialAdd(axial, axialDirections[direction]);
}

export function cubeAdd(...cubes: CubeCoordinates[]) {
    const added: CubeCoordinates = {x: 0, y: 0, z: 0};
    for (const cube of cubes) {
        added.x += cube.x;
        added.y += cube.y;
        added.z += cube.z;
    }
    return added;
}

export function cubeMultiply(cube: CubeCoordinates, multiplier: number): CubeCoordinates {
    return {x: cube.x * multiplier, y: cube.y * multiplier, z: cube.z * multiplier};
}

export function cubeNeighbor(cube: CubeCoordinates, direction: number): CubeCoordinates {
    return cubeAdd(cube, cubeDirections[direction]);
}

export function* ring(radius: number, center?: AxialCoordinates): IterableIterator<AxialCoordinates> {
    let current = axialMultiply(axialDirections[4], radius);
    if (center !== undefined) {
        current = axialAdd(current, center);
    }
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            yield current;
            current = axialNeighbor(current, i);
        }
    }
}
