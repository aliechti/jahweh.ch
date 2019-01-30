import Sprite = PIXI.Sprite;
import {HexagonField} from './HexagonField';
import {Player} from './Game';

export interface TerritoryProps {
    player: Player;
    fields: HexagonField[];
}

export class Territory extends Sprite {

    public props: TerritoryProps;

    constructor(props: TerritoryProps) {
        super();
        this.props = props;
    }
}
