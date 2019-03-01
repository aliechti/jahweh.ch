import {AxialCoordinates} from '../Function/Coordinates';
import {Player} from '../Manager/PlayerManager';
import {Territory} from './Territory';
import {Unit} from './Unit';
import Sprite = PIXI.Sprite;

export interface HexagonFieldProps {
    axial: AxialCoordinates;
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

    get axial(): AxialCoordinates {
        return this.props.axial;
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
    }
}
