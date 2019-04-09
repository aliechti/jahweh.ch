import {Territory} from '../Component/Territory';
import {Unit, UnitType} from '../Component/Unit';
import {Actor, ActorProps} from '../Manager/PlayerManager';

export class SimpleAI implements Actor {

    private props: ActorProps;

    public init = (props: ActorProps) => {
        this.props = props;
    };

    public onTurnStart = () => {
        // Update Panel
        this.props.updatePanel({});
    };

    public doTurn = async () => {
        const {game} = this.props;
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
                this.moveUnits(units, territory);
                // Merge not moved units
                // todo: this is not yet used because there is a defending mechanism needed,
                //  otherwise the AI just overcommits on strong units and doesn't have enough weak units left to defend
                // const mergedUnits = this.mergeUnits(units, territory);
                // if (mergedUnits.length > 0) {
                //     this.moveUnits(units: mergedUnits, territory);
                // }
            }
            console.timeEnd('move-units ' + game.player.id);
            console.time('buy-units ' + game.player.id);
            // Buy movable unit
            const territoryNeighbors = map.getTerritoryNeighbors(territory);
            const strengthNeighbors = territoryNeighbors.map((neighbor) => {
                return {
                    field: neighbor,
                    strength: movementManager.getFieldDefendingStrength(neighbor),
                };
            });
            const requiredStrength = Math.min(...strengthNeighbors.map((neighbor) => neighbor.strength));
            const purchasableTypes = unitTypeManager.units.filter((type) => {
                return type.isBuildable
                    && type.isMovable
                    && type.strength > requiredStrength
                    && this.isAffordable(territory, type, 1);
            });
            const unitType = purchasableTypes.shift();
            console.log('buy unit', unitType, requiredStrength, purchasableTypes);
            if (unitType) {
                const neighbor = strengthNeighbors.find((neighbor) => neighbor.strength < unitType.strength);
                if (neighbor && buyUnit(unitType, neighbor.field, territory)) {
                    console.log('bought unit', neighbor, unitType.name);
                }
            }
            console.timeEnd('buy-units ' + game.player.id);
        }
    };

    private isAffordable(territory: Territory, type: UnitType, turns: number) {
        const money = territory.money - type.cost;
        // Not enough money
        if (money < 0) {
            return false;
        }
        // Prevent bankruptcy by not buy the unit if the salaries are bigger than the income
        const salaries = type.salary + territory.salaries();
        const income = territory.income() - salaries;
        // Has enough income to keep the unit
        if (income >= 0) {
            return true;
        }
        const moneyAtTurn = money + income * turns;
        // Can at least keep it up for [turns]
        return moneyAtTurn >= 0;

    }

    private moveUnits = (units: Unit[], territory: Territory) => {
        const {map, movementManager, player} = this.props.game;
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
    };

    private mergeUnits = (units: Unit[], territory: Territory): Unit[] => {
        const {map, movementManager} = this.props.game;
        const territoryNeighbors = map.getTerritoryNeighbors(territory);
        // Get and order territories strengths
        const requiredStrengths = territoryNeighbors.map((neighbor) => {
            return movementManager.getFieldDefendingStrength(neighbor);
        }).sort((a, b) => a - b);
        // Filter units which can move and order them by strength
        units = units.filter((unit) => unit.canMove).sort((a, b) => {
            return a.props.type.strength - b.props.type.strength;
        });
        let requiredStrength = requiredStrengths.shift();
        const mergedUnits: Unit[] = [];
        const removedUnits: Unit[] = [];
        for (const unit of units) {
            // Cancel if there isn't any field to attack
            if (requiredStrength === undefined) {
                break;
            }
            // Continue if this unit got merged
            if (removedUnits.includes(unit)) {
                continue;
            }
            // Find a unit which can be merged to attack a neighbor
            const nextUnit = units.find((u) => {
                const type = u.props.type;
                const strength = type.strength + unit.props.type.strength;
                if (strength <= (requiredStrength as number)) {
                    return false;
                }
                const mergedType = movementManager.getMergedType(type, unit.props.type);
                if (mergedType === undefined) {
                    return false;
                }
                // Prevent bankruptcy by not merge the unit if the salaries are bigger than the income
                return mergedType.salary + territory.salaries() <= territory.income();
            });
            // Cancel if no unit was found (because of the sort order the next ones are too costly)
            if (nextUnit === undefined) {
                break;
            }
            if (movementManager.mergeUnits(unit, nextUnit)) {
                mergedUnits.push(unit);
                removedUnits.push(nextUnit);
            }
        }
        return mergedUnits;
    };
}
