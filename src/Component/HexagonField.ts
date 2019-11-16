import {Sprite} from 'pixi.js';
import {AxialCoordinates} from '../Function/Coordinates';
import {Player} from '../Manager/PlayerManager';
import {Territory} from './Territory';
import {Unit} from './Unit';

export interface HexagonFieldProps {
    axial: AxialCoordinates;
    player: Player;
    territory?: Territory;
    unit?: Unit;
}

export class HexagonField extends Sprite implements AxialCoordinates {
    private props: HexagonFieldProps;

    constructor(props: HexagonFieldProps) {
        super(props.player.hexagonTexture);
        this.props = props;
    }

    get q(): number {
        return this.props.axial.q;
    }

    get r(): number {
        return this.props.axial.r;
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
