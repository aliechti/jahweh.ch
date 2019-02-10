import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;
import InteractionEvent = PIXI.interaction.InteractionEvent;
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
    onClick: (unit: Unit, e: InteractionEvent) => void;
}

export class Unit extends Sprite {

    public props: UnitProps;

    constructor(props: UnitProps) {
        super(props.type.texture);
        this.props = props;
        this.interactive = true;
        this.buttonMode = true;
        this.on('click', this.handleClick);
    }

    private handleClick = (e: InteractionEvent) => {
        this.props.onClick(this, e);
    };
}
