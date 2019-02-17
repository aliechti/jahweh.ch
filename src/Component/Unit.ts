import InteractionEvent = PIXI.interaction.InteractionEvent;
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
    onClick: (unit: Unit, e: InteractionEvent) => void;
}

export class Unit extends Sprite {

    public props: UnitProps;
    private _canMove: boolean;

    constructor(props: UnitProps) {
        super(props.type.texture);
        this.props = props;
        this._canMove = false;
        this.onTurn();
        this.on('click', this.handleClick);
    }

    private handleClick = (e: InteractionEvent) => {
        this.props.onClick(this, e);
    };

    public setType(type: UnitType): void {
        this.props.type = type;
        this.texture = type.texture;
    }

    get canMove(): boolean {
        return this._canMove;
    }

    set canMove(value: boolean) {
        this._canMove = value;
        this.interactive = value;
        this.buttonMode = value;
    }

    public onTurn(): void {
        if (this.props.type.isMovable) {
            this.canMove = true;
        }
    }

    public offTurn(): void {
        if (this.props.type.isMovable) {
            this.canMove = false;
        }
    }
}
