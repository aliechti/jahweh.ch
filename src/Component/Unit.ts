import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;
import {HexagonField} from './HexagonField';

export type Buildings = 'gym' | 'instructor';
export type Units = 'leek' | 'gym-bro' | 'bodybuilder' | 'strongman';
export type UnitTypes = Buildings | Units;

export interface UnitProps {
    type: UnitTypes;
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
