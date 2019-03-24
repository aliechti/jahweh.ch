import {Unit} from '../Component/Unit';
import {Actor, OnTurnProps, Player} from '../Manager/PlayerManager';

export class Human implements Actor {
    public onTurnStart = (props: OnTurnProps) => {
        const units = this.getPlayerUnits(props.player);
        // Set player unit interactivity
        for (const unit of units) {
            unit.interactive = true;
            unit.buttonMode = true;
        }
    };

    public onTurnEnd = (props: OnTurnProps) => {
        const units = this.getPlayerUnits(props.player);
        // Remove player unit interactivity
        for (const unit of units) {
            unit.interactive = false;
            unit.buttonMode = false;
        }
    };

    private getPlayerUnits(player: Player): Unit[] {
        return player.territories.map(
            (territory) => territory.props.fields,
        ).reduce((previous, current) => {
            return Array().concat(previous, current);
        }).map((field) => {
            return field.unit;
        }).filter((unit) => unit !== undefined) as Unit[];
    }
}
