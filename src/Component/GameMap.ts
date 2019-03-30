import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';
import {Territory} from './Territory';

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
            // Add if neighbor is from another player and isn't already included
            neighbors.push(...this.grid.getFieldNeighbors(field)
                .filter((f) => f.player !== field.player && !neighbors.includes(f)));
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
            field.player.territories.push(territory);
            territory.addField(...this.grid.getConnectedFields(field));
        }
    }

    public deleteTerritory(territory: Territory): void {
        GameMap.deleteTerritoryFrom(territory, territory.props.player.territories);
        GameMap.deleteTerritoryFrom(territory, this.territories);
    }

    private static deleteTerritoryFrom(territory: Territory, territories: Territory[]): void {
        const index = territories.indexOf(territory);
        if (index !== -1) {
            territories.splice(index, 1);
        }
    }
}
