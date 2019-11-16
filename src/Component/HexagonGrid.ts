import {Container} from 'pixi.js';
import {AxialCoordinates, axialDirections} from '../Function/Coordinates';
import {HexagonField} from './HexagonField';

export class HexagonGrid extends Container {
    private _fields: Map<string, HexagonField>;

    constructor() {
        super();
        this._fields = new Map();
    }

    public getConnectedFields(field: HexagonField): HexagonField[] {
        const queue: HexagonField[] = [field];
        let neighbor;
        let i = 0;
        while ((neighbor = queue[i++]) && neighbor) {
            // Add it if its the same player and not in the list yet
            queue.push(...this.getFieldNeighbors(neighbor)
                .filter((f) => f.player === field.player && !queue.includes(f)));
        }
        return queue;
    }

    public getFieldNeighbors(field: HexagonField): HexagonField[] {
        const neighbors: HexagonField[] = [];
        for (const direction of axialDirections) {
            const q = field.q + direction.q;
            const r = field.r + direction.r;
            const neighbor = this.get({q, r});
            if (neighbor !== undefined) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    public set(field: HexagonField): void {
        this._fields.set(HexagonGrid.key(field), field);
        this.addChild(field);
    }

    public get(axial: AxialCoordinates): HexagonField | undefined {
        return this._fields.get(HexagonGrid.key(axial));
    }

    public delete(axial: AxialCoordinates): void {
        const field = this.get(axial);
        if (field) {
            this.removeChild(field);
            this._fields.delete(HexagonGrid.key(axial));
        }
    }

    public fields(): IterableIterator<HexagonField> {
        return this._fields.values();
    }

    public size(): number {
        return this._fields.size;
    }

    private static key(axial: AxialCoordinates): string {
        return [axial.r, axial.q].join(',');
    }
}
