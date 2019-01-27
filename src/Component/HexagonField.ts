import {Player} from './Game';
import {Territory} from './HexagonGrid';
import {Unit} from './Unit';
import Sprite = PIXI.Sprite;

export interface HexagonFieldProps {
    player: Player;
    territory?: Territory;
    unit?: Unit;
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

    get unit(): Unit | undefined {
        return this.props.unit;
    }

    set unit(unit: Unit | undefined) {
        if (unit) {
            // Remove unit from previous field
            if (unit.props.field) {
                unit.props.field.unit = undefined;
            }
            // Add unit
            this.props.unit = unit;
            this.addChild(this.props.unit);
            // Add field to unit
            unit.props.field = this;
        } else if (this.props.unit) {
            // Remove unit
            this.props.unit.props.field = undefined;
            this.removeChild(this.props.unit);
            this.props.unit = undefined;
        }
    }
}
