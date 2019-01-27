import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;
import {HexagonField} from './HexagonField';

export interface UnitProps {
    type: 'capital' | 'peasant';
    texture: Texture;
    field?: HexagonField;
}

export class Unit extends Sprite {

    public props: UnitProps;

    constructor(props: UnitProps) {
        super(props.texture);
        this.props = props;
    }
}
