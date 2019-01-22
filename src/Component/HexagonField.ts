import {Player, Unit} from './Game';
import {Territory} from './HexagonGrid';
import Sprite = PIXI.Sprite;

export interface HexagonFieldProps {
    player: Player;
    territory?: Territory;
    unit?: Unit;
}

export class HexagonField extends Sprite {
    private props: HexagonFieldProps;
    private unitSprite: Sprite;

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

    get unit(): Unit | undefined {
        return this.props.unit;
    }

    set unit(unit: Unit | undefined) {
        this.props.unit = unit;
        if (unit) {
            this.unitSprite = new Sprite(unit.texture);
            this.addChild(this.unitSprite);
        } else {
            this.removeChild(this.unitSprite);
        }
    }
}
