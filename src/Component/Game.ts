import {ExplicitContainer} from '../Interface/ExplicitContainer';
import {DoTurnFunction, Player, PlayerManager} from '../Manager/PlayerManager';
import {UnitTypeManager} from '../Manager/UnitTypeManager';
import {GameMap} from './GameMap';
import {HexagonField} from './HexagonField';
import {HexagonGrid} from './HexagonGrid';
import {PanelProps} from './Overlay/Panel';
import {Territory} from './Territory';
import {Unit, UnitType} from './Unit';
import Container = PIXI.Container;
import InteractionEvent = PIXI.interaction.InteractionEvent;

export interface GameProps {
    playerManager: PlayerManager;
    grid: HexagonGrid;
    updatePanel: (props: GamePanelProps) => void;
    unitTypeManager: UnitTypeManager;
    dragManager: GameDragManager;
    onWin: (player: Player) => void;
}

export interface GameDragManager {
    getDragging: () => Unit | undefined;
    setDragging: (unit?: Unit) => void;
}

export type GamePanelProps = Pick<PanelProps, 'player' | 'territory'>;

export class Game extends Container {
    private props: GameProps;
    private map: GameMap;
    private player: Player;
    private unitContainer: ExplicitContainer<Unit>;
    private turn: number;
    private isAutoplayRunning: boolean;

    constructor(props: GameProps) {
        super();
        this.props = props;
        this.player = this.props.playerManager.first();
        this.map = new GameMap({grid: this.props.grid});
        this.turn = 1;
        this.isAutoplayRunning = false;
        this.unitContainer = new Container() as ExplicitContainer<Unit>;

        this.addChild(this.props.grid);
        this.addChild(this.unitContainer);

        for (const field of this.props.grid.fields()) {
            field.interactive = true;
            field.on('click', () => this.handleFieldClick(field));
        }
        for (const territory of this.map.territories) {
            const size = territory.props.fields.length;
            if (size > 1) {
                const field = territory.props.fields[0];
                this.addNewUnitToField(this.props.unitTypeManager.mainBuilding, field);
            }
        }
        this.handleTurnStart();
        this.autoPlay();
    }

    private updatePanel() {
        this.props.updatePanel({
            player: this.player,
            territory: this.player.selectedTerritory,
        });
    }

    private addNewUnitToField(type: UnitType, field: HexagonField) {
        const unit = new Unit({
            type: type,
            field: field,
            onClick: this.handleUnitClick,
        });
        this.setUnitToField(unit, field);
        this.unitContainer.addChild(unit);
    }

    private setUnitToField(unit: Unit, field: HexagonField) {
        // Remove unit from previous field
        if (unit.props.field) {
            unit.props.field.unit = undefined;
        } else {
            // Unit has no field, so it must be newly bought
            this.unitContainer.addChild(unit);
        }
        // Add field to unit
        unit.props.field = field;
        // Set unit to new field
        field.unit = unit;
        // Reset unit position
        unit.position = field.position;
    }

    private selectTerritory(territory: Territory) {
        this.unselectTerritory();
        this.player.selectedTerritory = territory;
        this.updatePanel();
        this.tintTerritory(this.player.selectedTerritory, 0x555555);
    }

    private unselectTerritory() {
        if (this.player.selectedTerritory) {
            this.tintTerritory(this.player.selectedTerritory, 0xffffff);
            this.player.selectedTerritory = undefined;
        }
    }

    private async autoPlay() {
        function sleep(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // This can be only run once at a time
        if (!this.isAutoplayRunning) {
            this.isAutoplayRunning = true;
            let doTurn = this.player.doTurn;
            while (doTurn) {
                doTurn({
                    player: this.player,
                    map: this.map,
                    unitTypeManager: this.props.unitTypeManager,
                    moveUnit: this.moveUnit,
                    buyUnit: this.buyUnit,
                });
                doTurn = this.nextTurn();
                await sleep(500);
            }
            this.isAutoplayRunning = false;
        }
    }

    private handleTurnStart = () => {
        const {playerManager} = this.props;
        const isFirstTurn = this.turn / playerManager.players.length <= 1;
        // Territories on turn
        for (const territory of this.map.territories) {
            if (territory.props.player === this.player) {
                if (isFirstTurn) {
                    territory.onStart();
                } else {
                    territory.onTurn();
                }
                // Remove units if territory is bankrupt
                if (territory.isBankrupt()) {
                    console.log('Territory bankruptcy');
                    for (const field of territory.props.fields) {
                        if (field.unit !== undefined && field.unit.props.type.salary > 0) {
                            this.removeUnit(field.unit);
                        }
                    }
                    territory.money = 0;
                }
            }
        }
        // Set current player to panel
        this.updatePanel();
        // Attach unit click handlers for current player and remove others
        this.setCurrentPlayerInteractivity();
    };

    private handleTurnEnd = () => {
        this.unselectTerritory();
    };

    private hasPlayerWon = (player: Player) => {
        const playerFieldCount = player.territories
            .map((territory) => territory.props.fields.length)
            .reduce((value, current) => current + value, 0);
        return playerFieldCount * 100 / this.map.grid.size() > 60;
    };

    private hasPlayerLost = (player: Player) => {
        const territories = player.territories.filter((territory) => {
            return territory.isControllable();
        });
        return territories.length === 0;
    };

    public nextTurns = async (): Promise<void> => {
        if (!this.isAutoplayRunning) {
            this.nextTurn();
            await this.autoPlay();
        }
    };

    private nextTurn = (): DoTurnFunction | undefined => {
        const {playerManager, onWin} = this.props;
        this.handleTurnEnd();
        if (this.hasPlayerWon(this.player)) {
            // todo: win condition based on player count
            console.info('Player has won', this.player);
            onWin(this.player);
            return;
        }
        // Check if next player has already lost and remove him if so
        let nextPlayer;
        let i = playerManager.players.length;
        do {
            nextPlayer = playerManager.next(this.player);
            if (this.hasPlayerLost(nextPlayer)) {
                console.info('Player has lost', nextPlayer);
                playerManager.delete(nextPlayer);
                nextPlayer = undefined;
            }
        } while (nextPlayer === undefined && i-- > 0);
        if (nextPlayer === undefined) {
            console.error('Next turn next player chooser is probably broken');
            return;
        }
        this.player = nextPlayer;
        // Start next turn
        this.turn++;
        this.handleTurnStart();
        return this.player.doTurn;
    };

    private setCurrentPlayerInteractivity(): void {
        for (const unit of this.unitContainer.children) {
            const field = unit.props.field;
            if (field && field.player === this.player) {
                unit.onTurn();
            } else {
                unit.offTurn();
            }
        }
    }

    private moveUnit = (unit: Unit, field: HexagonField): boolean => {
        if (unit === field.unit) {
            console.warn('Unit is already on this field');
            return false;
        }
        // Use unit field territory and player
        let territory: Territory;
        if (unit.props.field && unit.props.field.territory) {
            territory = unit.props.field.territory;
        } else if (this.player.selectedTerritory !== undefined) {
            // Use selected territory if new unit bought and doesn't have a field attached yet
            territory = this.player.selectedTerritory;
        } else {
            console.warn('No territory selected');
            return false;
        }
        const fieldTerritory = field.territory;
        if (fieldTerritory === undefined) {
            console.warn('Field has no territory');
            return false;
        }
        const territoryNeighbors = this.map.getTerritoryNeighbors(territory);
        const isMovingToNeighbors = territoryNeighbors.includes(field);
        const isMovingInsideTerritory = territory.props.fields.includes(field);
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
        if (field.player !== this.player) {
            const fieldNeighbors = this.props.grid.getFieldNeighbors(field);
            const defendingPoints = Math.max(...fieldNeighbors.map((f) => {
                return (f.player !== field.player ? 0 : (f.unit ? f.unit.props.type.strength : 0));
            }));
            const attacking = unit.props.type;
            if (attacking.strength <= defendingPoints) {
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
                this.unitContainer.removeChild(field.unit);
                field.unit.props.field = undefined;
                field.unit = undefined;
                console.log('Defending unit killed');
            }
            field.player = this.player;
            // Remove from old territory
            fieldTerritory.props.fields.splice(fieldTerritory.props.fields.indexOf(field), 1);
            // Add to new territory
            territory.props.fields.push(field);
            // Set new territory to field
            field.territory = territory;
            // Merge territories
            const notConnectedTerritories = new Set<Territory>(fieldNeighbors.filter((neighbor) => {
                return neighbor.player === this.player && neighbor.territory !== territory;
            }).map((neighbor) => {
                return neighbor.territory as Territory;
            }));
            for (const neighbor of notConnectedTerritories) {
                territory.money += neighbor.money;
                // Remove other main buildings
                this.removeUnit(this.getTerritoryMainBuilding(neighbor));
                // Add fields to territory and remove other territory
                territory.addField(...neighbor.props.fields);
                neighbor.props.fields = [];
                this.map.deleteTerritory(neighbor);
            }
            // Split
            const enemyFields = fieldNeighbors.filter((neighbor) => {
                return neighbor.player !== this.player;
            });
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
                        const connectedFields = this.props.grid.getConnectedFields(fieldOnSameTerritory);
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
            // Renew main buildings
            const enemyTerritories = new Set(enemyFields.map((neighbor) => {
                return neighbor.territory as Territory;
            }));
            for (const enemyTerritory of enemyTerritories) {
                const mainBuilding = this.getTerritoryMainBuilding(enemyTerritory);
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
                            this.addNewUnitToField(this.props.unitTypeManager.mainBuilding, newMainBuildingField);
                        }
                    }
                } else if (!enemyTerritory.isControllable()) {
                    // Remove main building and every other unit if territory isn't controllable anymore
                    for (const enemyField of enemyTerritory.props.fields) {
                        this.removeUnit(enemyField.unit);
                    }
                }
            }
            // Recalculate selected territory
            if (this.player.selectedTerritory) {
                this.selectTerritory(this.player.selectedTerritory);
            }
        } else if (field.unit !== undefined) {
            // Merge units from the same player if there is a unit with the same cost
            const stayingType = field.unit.props.type;
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
                unit.canMove = field.unit.canMove;
                this.removeUnit(field.unit);
                unit.setType(mergedType);
            } else {
                console.warn('No type with same cost found to merge');
                return false;
            }
        }
        this.setUnitToField(unit, field);
        // Disable moving on moved unit for this turn if it has moved to neighbors
        if (isMovingToNeighbors) {
            console.log('has moved to neighbors, disable moving this turn');
            unit.canMove = false;
        }
        return true;
    };

    private removeUnit(unit: Unit | undefined) {
        if (unit && unit.props.field) {
            unit.props.field.unit = undefined;
            unit.props.field = undefined;
            this.unitContainer.removeChild(unit);
        }
    }

    private getTerritoryMainBuilding(territory: Territory): Unit | undefined {
        const field = territory.props.fields.find((item) => {
            return item.unit !== undefined && item.unit.props.type === this.props.unitTypeManager.mainBuilding;
        });
        if (field === undefined) {
            return undefined;
        }
        return field.unit;
    }

    private handleFieldClick = (field: HexagonField) => {
        const {dragManager} = this.props;
        const unit = dragManager.getDragging();
        console.log('click field');
        if (unit !== undefined) {
            if (unit.isBought()) {
                this.moveUnit(unit, field);
            } else if (this.player.selectedTerritory) {
                this.buyUnit(unit.props.type, field, this.player.selectedTerritory);
            }
            // Reset unit dragging
            dragManager.setDragging(undefined);
        } else if (field.territory && field.player === this.player) {
            // Only select other territory if no unit is dragging and its the current player
            this.selectTerritory(field.territory);
        } else {
            console.warn('Can\'t use another players territory');
        }
    };

    private handleUnitClick = (unit: Unit, e: InteractionEvent) => {
        console.log('click unit');
        const {dragManager} = this.props;
        if (dragManager.getDragging() === undefined) {
            dragManager.setDragging(unit);
            e.stopPropagation();
        } else if (unit.props.field) {
            this.handleFieldClick(unit.props.field);
        }
    };

    public handlePanelUnitClick = (type: UnitType, position: { x: number, y: number }) => {
        console.log('panel unit click', type);
        const territory = this.player.selectedTerritory;
        if (territory === undefined) {
            console.warn('no territory selected');
            return;
        }
        const {dragManager} = this.props;
        if (dragManager.getDragging() !== undefined) {
            console.warn('you can\'t drag another unit');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        const unit = new Unit({type, onClick: this.handleUnitClick});
        unit.x = position.x;
        unit.y = position.y;
        dragManager.setDragging(unit);
    };

    private buyUnit = (type: UnitType, field: HexagonField, territory: Territory): Unit | undefined => {
        if (!type.isBuildable) {
            console.warn('unit type is not buildable');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        this.selectTerritory(territory);
        const unit = new Unit({type, onClick: this.handleUnitClick});
        if (this.moveUnit(unit, field)) {
            territory.money -= type.cost;
            return unit;
        }
    };

    private tintTerritory(territory: Territory | undefined, tint: number) {
        if (territory) {
            for (const field of territory.props.fields) {
                field.tint = tint;
            }
        }
    }
}
