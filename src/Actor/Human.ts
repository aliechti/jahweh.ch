import {HexagonField} from '../Component/HexagonField';
import {Unit} from '../Component/Unit';
import {Actor, OnTurnProps, Player} from '../Manager/PlayerManager';

export class Human implements Actor {

    public isInteractive = true;

    public onTurnStart = (props: OnTurnProps) => {
        // Set player unit interactivity
        const fields = this.getPlayerFields(props.player);
        const units = this.getFieldUnits(fields);
        for (const unit of units) {
            if (unit.canMove) {
                unit.setInteractive(true);
            }
        }
    };

    public onTurnEnd = (props: OnTurnProps) => {
        const fields = this.getPlayerFields(props.player);
        const units = this.getFieldUnits(fields);
        // Remove player unit interactivity
        for (const unit of units) {
            unit.setInteractive(false);
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
}
