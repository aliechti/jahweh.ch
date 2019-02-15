import {HexagonField} from './HexagonField';
import {AxialCoordinates, axialDirections, AxialMap} from '../Function/Coordinates';
import Container = PIXI.Container;

export class HexagonGrid extends Container {
    private _fields: AxialMap<HexagonField>;

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
        const axial = field.axial;
        const neighbors: HexagonField[] = [];
        for (const direction of axialDirections) {
            const q = axial.q + direction.q;
            const r = axial.r + direction.r;
            const field = this.get({q, r});
            if (field !== undefined) {
                neighbors.push(field);
            }
        }
        return neighbors;
    }

    public set(axial: AxialCoordinates, field: HexagonField): void {
        let row = this._fields.get(axial.r);
        if (row == undefined) {
            row = new Map();
            this._fields.set(axial.r, row);
        }
        if (row.has(axial.q)) {
            this.removeChild(field);
        }
        this.addChild(field);
        row.set(axial.q, field);
    }

    public get(axial: AxialCoordinates): HexagonField | undefined {
        const row = this._fields.get(axial.r);
        if (row) {
            return row.get(axial.q);
        }
        return undefined;
    }

    public delete(axial: AxialCoordinates): void {
        const row = this._fields.get(axial.r);
        if (row) {
            row.delete(axial.q);
        }
    }

    public* fields(): IterableIterator<HexagonField> {
        for (const [, r] of this._fields) {
            for (const [, q] of r) {
                yield q;
            }
        }
    }
}
