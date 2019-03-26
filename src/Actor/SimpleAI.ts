import {Game} from '../Component/Game';
import {Unit} from '../Component/Unit';
import {Actor} from '../Manager/PlayerManager';

export class SimpleAI implements Actor {
    public doTurn = async (game: Game) => {
        const {player, map, movementManager, buyUnit} = game;
        const {unitTypeManager} = game.props;
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
                        if (movementManager.move(unit, neighbor, player)) {
                            territoryNeighbors.delete(neighbor);
                            break;
                        }
                    }
                }
            }
            // Buy movable unit
            const territoryNeighbors = map.getTerritoryNeighbors(territory);
            const requiredStrength = Math.min(...territoryNeighbors.map((neighbor) => {
                return movementManager.getFieldDefendingStrength(neighbor);
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
                        console.log('bought unit', neighbor, unitType.name);
                        break;
                    }
                }
            }
        }
    };
}
