import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;
import {HexagonField} from './HexagonField';

type Buildings = 'gym' | 'instructor';
type Units = 'leek' | 'gym-bro' | 'bodybuilder' | 'strongman';

export interface UnitProps {
    type: Buildings | Units;
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
