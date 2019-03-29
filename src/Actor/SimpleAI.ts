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
            console.time('move-units ' + game.player.id);
            // Move units
            let units = territory.props.fields.map((field) => {
                return field.unit;
            }).filter((unit) => unit !== undefined) as Unit[];
            if (units.length > 0) {
                const territoryNeighbors = map.getTerritoryNeighbors(territory);
                const strengthNeighbors = territoryNeighbors.map((neighbor) => {
                    return {
                        field: neighbor,
                        strength: movementManager.getFieldDefendingStrength(neighbor),
                    };
                });
                const requiredStrength = Math.min(...strengthNeighbors.map((neighbor) => neighbor.strength));
                // Filter too weak units
                units = units.filter((unit) => {
                    return unit.props.type.strength > requiredStrength;
                });
                // Order units by strength to not waste any strong unit
                units.sort((a, b) => {
                    return a.props.type.strength - b.props.type.strength;
                });
                for (const unit of units) {
                    if (!unit.canMove) {
                        continue;
                    }
                    for (const neighbor of strengthNeighbors) {
                        if (unit.props.type.strength > neighbor.strength
                            && movementManager.move(unit, neighbor.field, player)
                        ) {
                            // Remove neighbor, to not check it again
                            const index = strengthNeighbors.indexOf(neighbor);
                            if (index !== -1) {
                                strengthNeighbors.splice(index, 1);
                            }
                            break;
                        }
                    }
                }
            }
            console.timeEnd('move-units ' + game.player.id);
            console.time('buy-units ' + game.player.id);
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
            console.timeEnd('buy-units ' + game.player.id);
        }
    };
}
