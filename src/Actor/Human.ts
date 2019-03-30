import {Game} from '../Component/Game';
import {HexagonField} from '../Component/HexagonField';
import {Territory} from '../Component/Territory';
import {Unit} from '../Component/Unit';
import {Actor, ActorProps, Player} from '../Manager/PlayerManager';
import InteractionEvent = PIXI.interaction.InteractionEvent;

type InteractionHandler = (e: InteractionEvent) => void;

export class Human implements Actor {

    private props: ActorProps;
    private fieldClickHandlers: Map<HexagonField, InteractionHandler> = new Map();
    private unitClickHandlers: Map<Unit, InteractionHandler> = new Map();

    public init = (props: ActorProps) => {
        this.props = props;
    };

    public onTurnStart = () => {
        const {game} = this.props;
        const {player, map} = game;
        // Set player field interactivity
        for (const field of map.grid.fields()) {
            const clickHandler = (e: InteractionEvent) => this.handleFieldClick(game, field, e);
            field.on('click', clickHandler);
            this.fieldClickHandlers.set(field, clickHandler);
            field.interactive = true;
        }
        // Set player unit interactivity
        const fields = this.getPlayerFields(player);
        const units = this.getFieldUnits(fields);
        for (const unit of units) {
            if (unit.canMove) {
                const clickHandler = (e: InteractionEvent) => this.handleUnitClick(game, unit, e);
                unit.on('click', clickHandler);
                this.unitClickHandlers.set(unit, clickHandler);
                unit.setInteractive(true);
            }
        }
    };

    public onTurnEnd = () => {
        const {game} = this.props;
        const fields = this.getPlayerFields(game.player);
        const units = this.getFieldUnits(fields);
        this.unselectTerritory(game);
        // Remove player unit interactivity
        for (const unit of units) {
            unit.setInteractive(false);
        }
        // Remove click handlers
        for (const [field, handler] of this.fieldClickHandlers) {
            field.off('click', handler);
            this.fieldClickHandlers.delete(field);
        }
        for (const [unit, handler] of this.unitClickHandlers) {
            unit.off('click', handler);
            this.unitClickHandlers.delete(unit);
        }
    };

    private getFieldUnits(fields: HexagonField[]): Unit[] {
        return fields.map((field) => {
            return field.unit;
        }).filter((unit) => unit !== undefined) as Unit[];
    }

    private getPlayerFields(player: Player): HexagonField[] {
        return player.territories.map(
            (territory) => territory.props.fields,
        ).reduce((previous, current) => {
            return Array().concat(previous, current);
        });
    }

    private handleFieldClick = (game: Game, field: HexagonField, e: InteractionEvent) => {
        const {player, movementManager, buyUnit, unitManager} = game;
        const {dragManager} = game.props;
        const unit = dragManager.getDragging();
        console.log('click field');
        if (unit !== undefined) {
            // If the unit has a field its already bought
            if (unitManager.getField(unit)) {
                movementManager.move(unit, field, player);
            } else if (player.selectedTerritory) {
                const newUnit = buyUnit(unit.props.type, field, player.selectedTerritory);
                if (newUnit) {
                    // Update panel money
                    game.updatePanel();
                    if (newUnit.canMove) {
                        newUnit.setInteractive(true);
                    }
                }
            }
            // Recalculate selected territory
            if (game.player.selectedTerritory) {
                this.selectTerritory(game, game.player.selectedTerritory);
            }
            // Reset unit dragging
            dragManager.setDragging(undefined);
        } else if (field.player === player) {
            // Only select other territory/unit if no unit is dragging and its the current player
            if (field.territory) {
                this.selectTerritory(game, field.territory);
            }
            if (field.unit && field.unit.canMove) {
                this.handleUnitClick(game, field.unit, e);
            }
        } else {
            console.warn('Can\'t use another players territory');
        }
    };

    private handleUnitClick = (game: Game, unit: Unit, e: InteractionEvent) => {
        console.log('click unit');
        const {dragManager} = game.props;
        const field = game.unitManager.getField(unit);
        if (dragManager.getDragging() === undefined) {
            dragManager.setDragging(unit, e.data.global);
            if (field && field.territory) {
                this.selectTerritory(game, field.territory);
            }
        } else if (field) {
            this.handleFieldClick(game, field, e);
        }
    };

    private selectTerritory = (game: Game, territory: Territory) => {
        this.unselectTerritory(game);
        game.player.selectedTerritory = territory;
        game.updatePanel();
        this.tintTerritory(game.player.selectedTerritory, 0x555555);
    };

    private unselectTerritory(game: Game) {
        if (game.player.selectedTerritory) {
            this.tintTerritory(game.player.selectedTerritory, 0xffffff);
            game.player.selectedTerritory = undefined;
        }
    }

    private tintTerritory(territory: Territory | undefined, tint: number) {
        if (territory) {
            for (const field of territory.props.fields) {
                field.tint = tint;
            }
        }
    }
}
