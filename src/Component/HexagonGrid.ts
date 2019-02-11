import {HexagonField} from './HexagonField';
import {ExplicitContainer} from '../Interface/ExplicitContainer';
import Container = PIXI.Container;

export interface HexagonGridProps {
    columns: number;
    rows: number;
}

export interface OffsetCoordinates {
    x: number;
    y: number;
}

export class HexagonGrid extends Container implements ExplicitContainer<HexagonField> {
    public children: HexagonField[];
    public readonly props: HexagonGridProps;

    constructor(props: HexagonGridProps) {
        super();
        this.props = props;
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

    public getFieldChildByOffset(x: number, y: number): HexagonField {
        return this.getChildAt(x + y * this.props.columns);
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
            try {
                neighbors.push(this.getFieldChildByOffset(neighborX, neighborY));
            } catch (e) {
                // Ignore
            }
        }
        return neighbors;
    }
}
