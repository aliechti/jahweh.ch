import {Unit} from '../Component/Unit';
import {DoTurnFunction} from '../Manager/PlayerManager';

export const simpleAI: DoTurnFunction = (props) => {
    const {player, map, moveUnit, unitTypeManager, buyUnit} = props;
    for (const territory of player.territories) {
        if (!territory.isControllable()) {
            continue;
        }
        // Move units
        const units = territory.props.fields.map((field) => {
            return field.unit;
        }).filter((unit) => unit !== undefined) as Unit[];
        if (units.length > 0) {
            const territoryNeighbors = new Set(map.getTerritoryNeighbors(territory));
            for (const unit of units) {
                if (!unit.canMove) {
                    continue;
                }
                for (const neighbor of territoryNeighbors) {
                    if (moveUnit(unit, neighbor)) {
                        territoryNeighbors.delete(neighbor);
                        break;
                    }
                }
            }
        }
        // Buy movable unit
        const territoryNeighbors = map.getTerritoryNeighbors(territory);
        const requiredStrength = Math.min(...territoryNeighbors.map((neighbor) => {
            const fieldNeighbors = map.grid.getFieldNeighbors(neighbor);
            const ownStrength = neighbor.unit ? neighbor.unit.props.type.strength : 0;
            const defendingPoints = Math.max(ownStrength, ...fieldNeighbors.map((f) => {
                return (f.player !== neighbor.player ? 0 : (f.unit ? f.unit.props.type.strength : 0));
            }));
            console.log('d', defendingPoints);
            return defendingPoints;
        }));
        console.log('x', territoryNeighbors);
        const purchasableTypes = unitTypeManager.units.filter((type) => {
            return type.isBuildable
                && type.isMovable
                && type.cost < territory.money
                && type.strength > requiredStrength;
        });
        const unitType = purchasableTypes.shift();
        console.log('buy unit', unitType, requiredStrength, purchasableTypes);
        if (unitType) {
            for (const neighbor of territoryNeighbors) {
                if (buyUnit(unitType, neighbor, territory)) {
                    console.log('bought unit', neighbor.axial, unitType.name);
                    break;
                }
            }
        }
    }
};
