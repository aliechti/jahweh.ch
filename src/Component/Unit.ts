import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;
import {HexagonField} from './HexagonField';

export interface UnitType {
    name: string;
    strength: number;
    cost: number;
    salary: number;
    isBuildable: boolean;
    isMovable: boolean;
    texture: Texture;
}

export interface UnitProps {
    type: UnitType;
    field?: HexagonField;
}

export class Unit extends Sprite {

    public props: UnitProps;

    constructor(props: UnitProps) {
        super(props.type.texture);
        this.props = props;
    }
}
