import {Player} from './Game';
import Sprite = PIXI.Sprite;

export interface HexagonFieldProps {
    player: Player;
}

export class HexagonField extends Sprite {
    private props: HexagonFieldProps;

    constructor(props: HexagonFieldProps) {
        super(props.player.hexagonTexture);
        this.props = props;
    }

    get player() {
        return this.props.player;
    }

    set player(player: Player) {
        this.props.player = player;
        this.texture = player.hexagonTexture;
    }
}
