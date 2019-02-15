import {HexagonField} from './HexagonField';
import {Territory} from './Territory';
import {HexagonGrid} from './HexagonGrid';

interface Props {
    grid: HexagonGrid;
}

export class GameMap {
    public territories: Territory[];
    public grid: HexagonGrid;

    constructor(props: Props) {
        this.grid = props.grid;
        this.grid.interactive = true;
        this.findTerritories();
    }

    public getTerritoryNeighbors(territory: Territory): HexagonField[] {
        const {fields} = territory.props;
        const neighbors: HexagonField[] = [];
        // Walk trough all territory fields
        for (const field of fields) {
            const fieldNeighbors = this.grid.getFieldNeighbors(field);
            // Walk trough all neighbors of this field
            for (const fieldNeighbor of fieldNeighbors) {
                // Only if it isn't already included and isn't in the territory fields
                if (!neighbors.includes(fieldNeighbor) && !fields.includes(fieldNeighbor)) {
                    neighbors.push(fieldNeighbor);
                }
            }
        }
        return neighbors;
    }

    private findTerritories(): void {
        this.territories = [];
        for (const field of this.grid.fields()) {
            // Only if no territory is defined
            if (field.territory !== undefined) {
                continue;
            }
            // Create new territory
            const territory = new Territory({
                player: field.player,
                fields: [],
            });
            this.territories.push(territory);
            territory.addField(...this.grid.getConnectedFields(field));
        }
    }
}
