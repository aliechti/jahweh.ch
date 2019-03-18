import {GameMap} from '../Component/GameMap';
import {HexagonField} from '../Component/HexagonField';
import {Territory} from '../Component/Territory';
import {Unit} from '../Component/Unit';
import {Player} from './PlayerManager';
import {UnitManager} from './UnitManager';
import {UnitTypeManager} from './UnitTypeManager';

interface Props {
    map: GameMap;
    unitTypeManager: UnitTypeManager;
    unitManager: UnitManager;
    selectTerritory: (territory: Territory) => void;
}

export class MovementManager {
    private props: Props;
    private map: GameMap;

    constructor(props: Props) {
        this.props = props;
        this.map = props.map;
    }

    public move = (unit: Unit, field: HexagonField, unitPlayer: Player): boolean => {
        if (unit === field.unit) {
            console.warn('Unit is already on this field');
            return false;
        }
        // Use unit field territory and player
        let unitTerritory: Territory;
        if (unit.props.field && unit.props.field.territory) {
            unitTerritory = unit.props.field.territory;
        } else if (unitPlayer.selectedTerritory !== undefined) {
            // Use selected territory if new unit bought and doesn't have a field attached yet
            unitTerritory = unitPlayer.selectedTerritory;
        } else {
            console.warn('No territory selected');
            return false;
        }
        const fieldTerritory = field.territory;
        if (fieldTerritory === undefined) {
            console.warn('Field has no territory');
            return false;
        }
        const territoryNeighbors = this.map.getTerritoryNeighbors(unitTerritory);
        const isMovingToNeighbors = territoryNeighbors.includes(field);
        const isMovingInsideTerritory = unitTerritory.props.fields.includes(field);
        if (isMovingInsideTerritory) {
            console.log('is moving inside territory');
        } else if (!unit.canMove) {
            console.warn('Only movable units can be placed outside the territory');
            return false;
        }
        if (!isMovingToNeighbors && !isMovingInsideTerritory) {
            console.warn('Unit can only move to neighbors or inside same territory');
            return false;
        }
        // capture field
        if (field.player !== unitPlayer) {
            this.captureField(unit, field, unitPlayer, unitTerritory);
        } else if (field.unit !== undefined) {
            // Merge units from the same player if there is a unit with the same cost
            this.mergeUnits(unit, field.unit);
        }
        this.props.unitManager.set(unit, field);
        // Disable moving on moved unit for this turn if it has moved to neighbors
        if (isMovingToNeighbors) {
            console.log('has moved to neighbors, disable moving this turn');
            unit.canMove = false;
        }
        return true;
    };

    public getFieldDefendingStrength(field: HexagonField) {
        const fieldNeighbors = this.map.grid.getFieldNeighbors(field);
        const ownStrength = field.unit ? field.unit.props.type.strength : 0;
        return Math.max(ownStrength, ...fieldNeighbors.map((f) => {
            return (f.player !== field.player ? 0 : (f.unit ? f.unit.props.type.strength : 0));
        }));
    }

    private captureField(unit: Unit, field: HexagonField, unitPlayer: Player, unitTerritory: Territory) {
        const fieldTerritory = field.territory as Territory;
        const attacking = unit.props.type;
        if (attacking.strength <= this.getFieldDefendingStrength(field)) {
            console.warn('Field is defended by a stronger or same strength unit');
            return false;
        }
        // Attack unit if there is one on this field
        if (field.unit !== undefined) {
            const defending = field.unit.props.type;
            if (attacking.strength <= defending.strength) {
                console.warn('Unit can only attack weaker units');
                return false;
            }
            // Defending is main building
            if (defending === this.props.unitTypeManager.mainBuilding) {
                fieldTerritory.money = 0;
            }
            // Remove defending unit
            this.props.unitManager.delete(field.unit);
            console.log('Defending unit killed');
        }
        field.player = unitPlayer;
        // Remove from old territory
        fieldTerritory.props.fields.splice(fieldTerritory.props.fields.indexOf(field), 1);
        // Add to new territory
        unitTerritory.props.fields.push(field);
        // Set new territory to field
        field.territory = unitTerritory;
        // Merge territories
        const fieldNeighbors = this.map.grid.getFieldNeighbors(field);
        const notConnectedTerritories = new Set<Territory>(fieldNeighbors.filter((neighbor) => {
            return neighbor.player === unitPlayer && neighbor.territory !== unitTerritory;
        }).map((neighbor) => {
            return neighbor.territory as Territory;
        }));
        this.mergeTerritories(unitTerritory, notConnectedTerritories);
        // Split
        const enemyFields = fieldNeighbors.filter((neighbor) => {
            return neighbor.player !== unitPlayer;
        });
        this.splitTerritories(enemyFields);
        // Renew main buildings
        const enemyTerritories = new Set(enemyFields.map((field) => {
            return field.territory as Territory;
        }));
        this.renewMainBuildings(enemyTerritories);
        // Recalculate selected territory
        if (unitPlayer.selectedTerritory) {
            this.props.selectTerritory(unitPlayer.selectedTerritory);
        }
    }

    private mergeTerritories(main: Territory, territories: Iterable<Territory>) {
        for (const neighbor of territories) {
            main.money += neighbor.money;
            // Remove other main buildings
            this.props.unitManager.delete(this.props.unitManager.getTerritoryMainBuilding(neighbor));
            // Add fields to territory and remove other territory
            main.addField(...neighbor.props.fields);
            neighbor.props.fields = [];
            this.map.deleteTerritory(neighbor);
        }
    }

    private splitTerritories(enemyFields: HexagonField[]) {
        const fieldsChecked: HexagonField[] = [];
        for (const enemyField of enemyFields) {
            if (fieldsChecked.includes(enemyField)) {
                continue;
            }
            fieldsChecked.push(enemyField);
            const onSameTerritory = enemyFields.filter((item) => {
                return item.territory === enemyField.territory && item !== enemyField;
            });
            if (onSameTerritory.length > 0) {
                // Loop trough fields with the same territory
                for (const fieldOnSameTerritory of onSameTerritory) {
                    if (fieldsChecked.includes(fieldOnSameTerritory)) {
                        continue;
                    }
                    fieldsChecked.push(fieldOnSameTerritory);
                    // If the connected fields don't contain each other they are split up
                    const connectedFields = this.map.grid.getConnectedFields(fieldOnSameTerritory);
                    if (!connectedFields.has(enemyField)) {
                        // make new territory
                        const newTerritory = new Territory({
                            player: fieldOnSameTerritory.player,
                            fields: [],
                        });
                        // Remove fields from old territory
                        for (const connectedField of connectedFields) {
                            if (connectedField.territory) {
                                const index = connectedField.territory.props.fields.indexOf(connectedField);
                                connectedField.territory.props.fields.splice(index, 1);
                            }
                        }
                        // Add to new territory
                        newTerritory.addField(...connectedFields);
                        this.map.territories.push(newTerritory);
                    }
                }
            }
        }
    }

    private renewMainBuildings(territories: Iterable<Territory>) {
        for (const enemyTerritory of territories) {
            const mainBuilding = this.props.unitManager.getTerritoryMainBuilding(enemyTerritory);
            // add new main building if there is none and territory is controllable
            if (mainBuilding === undefined && enemyTerritory.isControllable()) {
                const mainBuildingField = enemyTerritory.props.fields.find((item) => {
                    return item.unit !== undefined
                        && item.unit.props.type === this.props.unitTypeManager.mainBuilding;
                });
                if (mainBuildingField === undefined) {
                    // Add building to the field without a unit or replace it with the weakest one
                    function fieldScore(field: HexagonField) {
                        return field.unit === undefined ? 0 : field.unit.props.type.strength;
                    }

                    const fields = enemyTerritory.props.fields.sort((a, b) => {
                        return fieldScore(a) - fieldScore(b);
                    });
                    const newMainBuildingField = fields[0];
                    if (newMainBuildingField) {
                        this.props.unitManager.add(this.props.unitTypeManager.mainBuilding, newMainBuildingField);
                    }
                }
            } else if (!enemyTerritory.isControllable()) {
                // Remove main building and every other unit if territory isn't controllable anymore
                for (const enemyField of enemyTerritory.props.fields) {
                    this.props.unitManager.delete(enemyField.unit);
                }
            }
        }
    }

    private mergeUnits(unit: Unit, fieldUnit: Unit) {
        const stayingType = fieldUnit.props.type;
        if (!stayingType.isBuildable || !stayingType.isMovable) {
            console.warn('Only buildable and movable units can merge together');
            return false;
        }
        const droppedType = unit.props.type;
        const cost = stayingType.cost + droppedType.cost;
        const mergedType = this.props.unitTypeManager.units.find((type) => {
            return type.cost === cost && type.isMovable && type.isBuildable;
        });
        if (mergedType) {
            console.log('Units merged', {
                dropped: stayingType,
                staying: droppedType,
                merged: mergedType,
            });
            // If unit staying has already moved the merged one has too
            unit.canMove = fieldUnit.canMove;
            this.props.unitManager.delete(fieldUnit);
            unit.setType(mergedType);
        } else {
            console.warn('No type with same cost found to merge');
            return false;
        }
    }
}
