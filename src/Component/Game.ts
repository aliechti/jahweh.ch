import {Application} from 'pixi.js';
import {HexagonGrid} from './HexagonGrid';
import {Territory} from './Territory';
import {UnitTypeManager} from './UnitTypeManager';
import {Unit, UnitType} from './Unit';
import {Panel, PanelProps} from './Panel';
import {ExplicitContainer} from '../Interface/ExplicitContainer';
import {HexagonField} from './HexagonField';
import {GameMap} from './GameMap';
import Texture = PIXI.Texture;
import InteractionEvent = PIXI.interaction.InteractionEvent;
import Container = PIXI.Container;
import Graphics = PIXI.Graphics;

export interface GameProps {
    app: Application;
    players: Player[];
    grid: HexagonGrid;
    panel: PanelProps;
}

export interface PlayerProps {
    color: number;
}

export interface Player extends PlayerProps {
    hexagonTexture: Texture;
    selectedTerritory?: Territory;
}

export class Game {
    private props: GameProps;
    private app: Application;
    private grid: HexagonGrid;
    private map: GameMap;
    private players: Player[];
    private player: Player;
    private _draggingUnit?: Unit;
    private unitTypeManager: UnitTypeManager;
    private panel: Panel;
    private dragContainer: ExplicitContainer<Unit>;
    private unitContainer: ExplicitContainer<Unit>;
    private turn: number;

    constructor(props: GameProps) {
        this.props = props;
        this.app = props.app;
        this.grid = props.grid;
        this.map = new GameMap({grid: this.grid});
        this.players = props.players;
        this.player = props.players[0];
        this.turn = 1;
        this.unitTypeManager = new UnitTypeManager({renderer: this.app.renderer});
        this.dragContainer = new Container() as ExplicitContainer<Unit>;
        this.unitContainer = new Container() as ExplicitContainer<Unit>;

        this.panel = new Panel(this.props.panel);
        this.panel.x = window.innerWidth - this.props.panel.w;
        this.panel.setPlayer(this.player);
        this.panel.setUnitTypes(this.unitTypeManager.units, this.handlePanelUnitClick);
        const turnButton = new Graphics();
        turnButton.beginFill(0x552288);
        turnButton.drawRect(0, 0, 100, 20);
        turnButton.endFill();
        this.panel.setTurnButton(this.nextTurn, this.app.renderer.generateTexture(turnButton));

        this.app.stage.addChild(this.grid);
        this.app.stage.addChild(this.unitContainer);
        this.app.stage.addChild(this.panel);
        this.app.stage.addChild(this.dragContainer);

        for (const field of this.grid.children) {
            field.interactive = true;
            field.on('click', (e) => {
                console.log('click field');
                if (this.draggingUnit !== undefined) {
                    const originalField = this.draggingUnit.props.field;
                    const unit = this.draggingUnit;
                    const success = this.moveUnit(unit, field);
                    // Reset unit dragging
                    this.draggingUnit = undefined;
                    if (!success) {
                        // Reset unit position
                        if (originalField) {
                            unit.position = originalField.position;
                        } else {
                            console.warn('Newly bought unit cant move there');
                            // todo: refactor, it gets added to the unitContainer from the dragging setter
                            // Refund unit payment
                            if (this.player.selectedTerritory) {
                                this.player.selectedTerritory.money += unit.props.type.cost;
                            }
                            this.unitContainer.removeChild(unit);
                        }
                    }
                } else if (field.territory && field.player === this.player) {
                    // Only select other territory if no unit is dragging and its the current player
                    this.selectTerritory(field.territory);
                } else {
                    console.warn('Can\'t use another players territory');
                }
            });
        }
        for (const territory of this.map.territories) {
            const size = territory.props.fields.length;
            if (size > 1) {
                const field = territory.props.fields[0];
                this.addNewUnitToField(this.unitTypeManager.mainBuilding, field);
            }
        }
        this.setCurrentPlayerInteractivity();
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
        this.panel.setTerritory(territory);
        this.tintTerritory(this.player.selectedTerritory, 0x555555);
    }

    private unselectTerritory() {
        if (this.player.selectedTerritory) {
            this.tintTerritory(this.player.selectedTerritory, 0xffffff);
            this.player.selectedTerritory = undefined;
        }
    }

    private nextTurn = () => {
        const players = this.players;
        this.unselectTerritory();
        this.player = players[this.turn % players.length];
        this.turn++;
        // Attach unit click handlers for current player and remove others
        this.setCurrentPlayerInteractivity();
        // Territories on turn
        for (const territory of this.map.territories) {
            if (territory.props.player === this.player) {
                territory.onTurn();
                // Remove units if territory is bankrupt
                if (territory.isBankrupt()) {
                    console.log('Territory bankruptcy');
                    for (const field of territory.props.fields) {
                        if (field.unit !== undefined && field.unit.props.type !== this.unitTypeManager.mainBuilding) {
                            this.removeUnit(field.unit);
                        }
                    }
                    territory.money = 0;
                }
            }
        }
        // Set current player to panel
        this.panel.setPlayer(this.player);
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
        }
        if (!isMovingToNeighbors && !isMovingInsideTerritory) {
            console.warn('Unit can only move to neighbors or inside same territory');
            return false;
        }
        // capture field
        if (field.player !== this.player) {
            const fieldNeighbors = this.grid.getFieldNeighbors(field);
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
                if (defending === this.unitTypeManager.mainBuilding) {
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
                this.map.territories.splice(this.map.territories.indexOf(neighbor), 1);
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
                        const connectedFields = this.grid.getConnectedFields(fieldOnSameTerritory);
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
                            && item.unit.props.type === this.unitTypeManager.mainBuilding;
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
                            this.addNewUnitToField(this.unitTypeManager.mainBuilding, newMainBuildingField);
                        }
                    }
                } else if (mainBuilding !== undefined && !enemyTerritory.isControllable()) {
                    // Remove main building if there is one and territory isn't controllable anymore
                    this.removeUnit(this.getTerritoryMainBuilding(enemyTerritory));
                }
            }
            // Recalculate selected territory
            if (this.player.selectedTerritory) {
                this.selectTerritory(this.player.selectedTerritory);
            }
        } else if (field.unit !== undefined) {
            // Merge units from the same player if there is a unit with the same cost
            const droppedType = field.unit.props.type;
            const stayingType = unit.props.type;
            const cost = stayingType.cost + droppedType.cost;
            const mergedType = this.unitTypeManager.units.find((type) => {
                return type.cost === cost;
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
            return item.unit !== undefined && item.unit.props.type === this.unitTypeManager.mainBuilding;
        });
        if (field === undefined) {
            return undefined;
        }
        return field.unit;
    }

    private handleUnitClick = (unit: Unit, e: InteractionEvent) => {
        console.log('click unit');
        if (this.draggingUnit === undefined) {
            this.draggingUnit = unit;
            e.stopPropagation();
        }
    };

    private handlePanelUnitClick = (type: UnitType) => {
        console.log('panel unit click', type);
        const territory = this.player.selectedTerritory;
        if (territory === undefined) {
            console.warn('no territory selected');
            return;
        }
        if (this.draggingUnit !== undefined) {
            console.warn('you can\'t drag another unit');
            return;
        }
        if (territory.money < type.cost) {
            console.warn('not enough money to buy this unit');
            return;
        }
        territory.money -= type.cost;
        this.draggingUnit = new Unit({type, onClick: this.handleUnitClick});
    };

    private tintTerritory(territory: Territory | undefined, tint: number) {
        if (territory) {
            for (const field of territory.props.fields) {
                field.tint = tint;
            }
        }
    }

    private handleDragMove = (e: InteractionEvent) => {
        const unit = this.draggingUnit;
        if (unit) {
            unit.x = e.data.global.x;
            unit.y = e.data.global.y;
        }
    };

    get draggingUnit(): Unit | undefined {
        return this._draggingUnit;
    }

    set draggingUnit(unit: Unit | undefined) {
        if (this._draggingUnit !== undefined) {
            // Reset unit interactivity only if it can move
            if (this._draggingUnit.canMove) {
                this._draggingUnit.interactive = true;
            }
            this.grid.off('pointermove', this.handleDragMove);
            this.unitContainer.addChild(this._draggingUnit);
        }
        this._draggingUnit = unit;
        if (this._draggingUnit) {
            this._draggingUnit.interactive = false;
            this.grid.on('pointermove', this.handleDragMove);
            this.dragContainer.addChild(this._draggingUnit);
        }
    }
}
