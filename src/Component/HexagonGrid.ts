import {AxialCoordinates, axialDirections} from '../Function/Coordinates';
import {HexagonField} from './HexagonField';
import Container = PIXI.Container;

export class HexagonGrid extends Container {
    private _fields: Map<string, HexagonField>;

    constructor() {
        super();
        this._fields = new Map();
    }

    public getConnectedFields(field: HexagonField): Set<HexagonField> {
        const fields = new Set<HexagonField>();
        // Recursive function
        const addNeighbors = (hexagonField: HexagonField) => {
            fields.add(hexagonField);
            // Find and loop trough neighbors
            const neighbors = this.getFieldNeighbors(hexagonField);
            for (const neighbor of neighbors) {
                // Add it if its the same player and not in the list yet
                if (neighbor.player === hexagonField.player && !fields.has(neighbor)) {
                    // Recursion
                    addNeighbors(neighbor);
                }
            }
        };
        addNeighbors(field);
        return fields;
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
