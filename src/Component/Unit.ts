import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;

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
    }

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

    get canMove(): boolean {
        return this._canMove;
    }

    set canMove(value: boolean) {
        this._canMove = value;
        this.setInteractive(false);
    }

    setInteractive(value: boolean) {
        if (value) {
            this.play();
        } else {
            this.stop();
        }
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
