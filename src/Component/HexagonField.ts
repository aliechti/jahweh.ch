import {Player} from './Game';
import {Territory} from './HexagonGrid';
import Sprite = PIXI.Sprite;

export interface HexagonFieldProps {
    player: Player;
    territory?: Territory;
}

export class HexagonField extends Sprite {
    private props: HexagonFieldProps;

    constructor(props: HexagonFieldProps) {
        super(props.player.hexagonTexture);
        this.props = props;
    }

    get player(): Player {
        return this.props.player;
    }

    set player(player: Player) {
        this.props.player = player;
        this.texture = player.hexagonTexture;
    }

    get territory(): Territory | undefined {
        return this.props.territory;
    }

    set territory(territory: Territory | undefined) {
        this.props.territory = territory;
    }
}
