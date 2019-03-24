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
    private shakeStep: number = 0.03;
    private shakeMax: number = 0.18;
    private animationHandle?: number;

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

    public isBought(): boolean {
        return this.props.field !== undefined;
    }

    get canMove(): boolean {
        return this._canMove;
    }

    set canMove(value: boolean) {
        this._canMove = value;
        this.interactive = false;
    }

    get interactive(): boolean {
        return super.interactive;
    }

    set interactive(value: boolean) {
        if (value) {
            this.play();
        } else {
            this.stop();
        }
        super.interactive = value;
    }

    private play() {
        if (this.animationHandle === undefined) {
            this.animationHandle = requestAnimationFrame(this.animate);
        }
    }

    private stop() {
        if (this.animationHandle) {
            cancelAnimationFrame(this.animationHandle);
            this.animationHandle = undefined;
            this.rotation = 0;
        }
    }

    private animate = () => {
        this.rotation += this.shakeStep;
        if (this.rotation > this.shakeMax || this.rotation < -(this.shakeMax)) {
            this.shakeStep *= -1;
        }
        this.animationHandle = requestAnimationFrame(this.animate);
    };
}
