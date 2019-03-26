import {Game} from '../Component/Game';
import {HexagonField} from '../Component/HexagonField';
import {Unit} from '../Component/Unit';
import {Actor, Player} from '../Manager/PlayerManager';
import InteractionEvent = PIXI.interaction.InteractionEvent;

type InteractionHandler = (e: InteractionEvent) => void;

export class Human implements Actor {

    public isInteractive = true;
    private fieldClickHandlers: Map<HexagonField, InteractionHandler> = new Map();
    private unitClickHandlers: Map<Unit, InteractionHandler> = new Map();

    public onTurnStart = (game: Game) => {
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

    public onTurnEnd = (game: Game) => {
        const fields = this.getPlayerFields(game.player);
        const units = this.getFieldUnits(fields);
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
        const {player, movementManager, buyUnit} = game;
        const {dragManager} = game.props;
        const unit = dragManager.getDragging();
        console.log('click field');
        if (unit !== undefined) {
            if (unit.isBought()) {
                movementManager.move(unit, field, player);
            } else if (player.selectedTerritory) {
                buyUnit(unit.props.type, field, player.selectedTerritory);
            }
            // Reset unit dragging
            dragManager.setDragging(undefined);
        } else if (field.player === player) {
            // Only select other territory/unit if no unit is dragging and its the current player
            if (field.territory) {
                game.selectTerritory(field.territory);
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
        const {field} = unit.props;
        if (dragManager.getDragging() === undefined) {
            dragManager.setDragging(unit, e.data.global);
            if (field && field.territory) {
                game.selectTerritory(field.territory);
            }
        } else if (field) {
            this.handleFieldClick(game, field, e);
        }
    };
}
