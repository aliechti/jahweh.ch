import {HexagonField} from './HexagonField';
import Container = PIXI.Container;

export interface HexagonGridProps {
    columns: number;
    rows: number;
}

export interface OffsetCoordinates {
    x: number;
    y: number;
}

export class HexagonGrid extends Container {
    public fields: Map<number, HexagonField>;
    public readonly props: HexagonGridProps;

    constructor(props: HexagonGridProps) {
        super();
        this.props = props;
        this.fields = new Map<number, HexagonField>();
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
        const {x, y} = field.coordinates;
        const neighbors: HexagonField[] = [];
        const matrixEven = [-1, 0, 0, -1, 1, 0, 1, 1, 0, 1, -1, 1];
        const matrixOdd = [-1, -1, 0, -1, 1, -1, 1, 0, 0, 1, -1, 0];
        const isEven = x % 2;
        const matrix = (isEven ? matrixEven : matrixOdd);
        for (let i = 0; i < 6; i++) {
            const neighborX = x + matrix[i * 2];
            const neighborY = y + matrix[i * 2 + 1];
            const isOverRightEdge = neighborX >= this.props.columns;
            const isOverLeftEdge = neighborX < 0;
            if (isOverRightEdge || isOverLeftEdge) {
                continue;
            }
            const field = this.get({x: neighborX, y: neighborY});
            if (field !== undefined) {
                neighbors.push(field);
            }
        }
        return neighbors;
    }

    public add(field: HexagonField, coordinates: OffsetCoordinates): void {
        this.fields.set(this.getIndex(coordinates), field);
        this.addChild(field);
    }

    public get(coordinates: OffsetCoordinates): HexagonField | undefined {
        return this.fields.get(this.getIndex(coordinates));
    }

    public delete(coordinates: OffsetCoordinates): void {
        this.fields.delete(this.getIndex(coordinates));
    }

    public getIndex(coordinates: OffsetCoordinates): number {
        const {x, y} = coordinates;
        return x + y * this.props.columns;
    }
}
