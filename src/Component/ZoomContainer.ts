import Container = PIXI.Container;
import Point = PIXI.Point;

interface Props {
    options: ZoomOptions;
}

export interface ZoomOptions {
    min: number;
    max: number;
    steps: number;
}

export class ZoomContainer extends Container {
    private _zoom: number;
    private props: Props;

    constructor(props: Props) {
        super();
        this.props = props;
        this._zoom = 1;
        this.interactive = true;
    }

    public handleScrollZoom = (e: WheelEvent) => {
        if (e.deltaY > 0) {
            this.out();
        } else {
            this.in();
        }
    };

    public in = () => {
        const {options} = this.props;
        this.zoom += this.zoom * options.steps;
    };

    public out = () => {
        const {options} = this.props;
        this.zoom -= this.zoom * options.steps;
    };

    get zoom(): number {
        return this._zoom;
    }

    set zoom(value: number) {
        const {options} = this.props;
        this._zoom = Math.min(Math.max(value, options.min), options.max);
        this.scale = new Point(this._zoom, this._zoom);
    }

}
