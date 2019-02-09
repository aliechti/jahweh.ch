import {Application} from 'pixi.js';
import {HexagonGrid, HexagonGridProps} from './HexagonGrid';
import {HexagonProps} from './Hexagon';
import {Territory} from './Territory';
import {UnitTypeManager} from './UnitTypeManager';
import {Unit, UnitType} from './Unit';
import {Panel, PanelProps} from './Panel';
import {ExplicitContainer} from '../Interface/ExplicitContainer';
import {HexagonField} from './HexagonField';
import Texture = PIXI.Texture;
import InteractionEvent = PIXI.interaction.InteractionEvent;
import Container = PIXI.Container;
import Graphics = PIXI.Graphics;

export interface GameProps {
    app: Application;
    grid: HexagonGridProps;
    panel: PanelProps;
}

export interface Player {
    hexagonProps: Pick<HexagonProps, 'fillColor'>;
    hexagonTexture: Texture;
    selectedTerritory?: Territory;
}

export class Game {
    private props: GameProps;
    private grid: HexagonGrid;
    private player: Player;
    private _draggingUnit?: Unit;
    private unitTypeManager: UnitTypeManager;
    private panel: Panel;
    private dragContainer: ExplicitContainer<Unit>;
    private unitContainer: ExplicitContainer<Unit>;
    private turn: number;

    constructor(props: GameProps) {
        this.props = props;
        this.grid = new HexagonGrid(this.props.grid);
        this.player = this.grid.props.players[0];
        this.turn = 1;
        this.grid.interactive = true;
        this.unitTypeManager = new UnitTypeManager({renderer: this.props.app.renderer});
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
        this.panel.setTurnButton(this.nextTurn, this.props.app.renderer.generateTexture(turnButton));

        this.props.app.stage.addChild(this.grid);
        this.props.app.stage.addChild(this.unitContainer);
        this.props.app.stage.addChild(this.panel);
        this.props.app.stage.addChild(this.dragContainer);

        for (const field of this.grid.fieldContainer.children) {
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
                            // todo: revert payment
                            this.unitContainer.removeChild(unit);
                        }
                    }
                } else if (field.territory && field.player === this.player) {
                    // todo: remove, this is just for testing
                    field.territory.money += 10;
                    // Only select other territory if no unit is dragging and its the current player
                    this.selectTerritory(field.territory);
                } else {
                    console.warn('Can\'t use another players territory');
                }
            });
        }
        for (const territory of this.grid.territories) {
            const size = territory.props.fields.length;
            if (size > 1) {
                const field = territory.props.fields[0];
                const unit = new Unit({
                    type: this.unitTypeManager.mainBuilding,
                    field: field,
                    onClick: this.handleUnitClick,
                });
                field.unit = unit;
                unit.position = field.position;
                this.unitContainer.addChild(unit);
            }
        }
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
        const players = this.grid.props.players;
        this.unselectTerritory();
        this.player = players[this.turn % players.length];
        this.turn++;
    };

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
        const territoryNeighbors = this.grid.getTerritoryNeighbors(territory);
        const isMovingToNeighbors = territoryNeighbors.includes(field);
        const isMovingInsideTerritory = territory.props.fields.includes(field);
        if (isMovingToNeighbors) {
            console.log('is moving to neighbors');
        }
        if (isMovingInsideTerritory) {
            console.log('is moving inside territory');
        }
        if (!isMovingToNeighbors && !isMovingInsideTerritory) {
            console.warn('Unit can only move to neighbors or inside same territory');
            return false;
        }
        // Attack unit if there is one on this field
        if (field.unit !== undefined) {
            const defending = field.unit.props.type;
            const attacking = unit.props.type;
            // todo: implement unit attacking
            if (attacking.strength <= defending.strength) {
                console.warn('Unit can only attack weaker units');
                return false;
            }
            // Defending is main building
            if (defending === this.unitTypeManager.mainBuilding) {
                fieldTerritory.money = 0;
                // todo: check if is still controllable and rebuild main building
            }
            // Remove defending unit
            this.unitContainer.removeChild(field.unit);
            field.unit.props.field = undefined;
            field.unit = undefined;
            console.log('Defending unit killed');
        }
        // capture field
        if (field.player !== this.player) {
            field.player = this.player;
            // Remove from old territory
            fieldTerritory.props.fields.splice(fieldTerritory.props.fields.indexOf(field), 1);
            // Add to new territory
            territory.props.fields.push(field);
            // Set new territory to field
            field.territory = territory;
            // todo: recalculate territory if splitted up or merge it if neighbor is from same player
            // Merge territories
            const fieldNeighbors = this.grid.getFieldNeighbors(field);
            const notConnectedTerritories = new Set<Territory>(fieldNeighbors.filter((neighbor) => {
                return neighbor.player === this.player && neighbor.territory !== territory;
            }).map((neighbor) => {
                return neighbor.territory as Territory;
            }));
            for (const neighbor of notConnectedTerritories) {
                territory.money += neighbor.money;
                territory.addField(...neighbor.props.fields);
                neighbor.props.fields = [];
                this.grid.territories.splice(this.grid.territories.indexOf(neighbor), 1);
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
                    for (const fieldOnSameTerritory of onSameTerritory) {
                        if (fieldsChecked.includes(fieldOnSameTerritory)) {
                            continue;
                        }
                        fieldsChecked.push(fieldOnSameTerritory);
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
                            this.grid.territories.push(newTerritory);
                            // todo: add new main building
                        }
                    }
                }
            }
            // fix: recalculate selected territory for captured field tint
        }
        // Remove unit from previous field
        if (unit.props.field) {
            unit.props.field.unit = undefined;
        }
        // Add field to unit
        unit.props.field = field;
        // Set unit to new field
        field.unit = unit;
        // Reset unit position
        field.unit.position = field.position;
        return true;
    };

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
            this._draggingUnit.interactive = true;
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
