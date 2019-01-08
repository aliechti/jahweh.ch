import {CanvasObject} from './CanvasObject';

export class Canvas {
    private element: HTMLCanvasElement;
    private objects: CanvasObject[];
    private context: CanvasRenderingContext2D;

    public constructor(element: HTMLCanvasElement) {
        this.element = element;
        const context = element.getContext('2d');
        if (!context) {
            throw new Error('Canvas not supported');
        }
        this.context = context;
        this.objects = [];
        this.fixSize();
        window.addEventListener('resize', () => {
            this.fixSize();
            this.render();
        });
        this.context.save();
    }

    public add(object: CanvasObject<any>) {
        this.objects.push(object);
    }

    public render = () => {
        for (const object of this.objects) {
            object.renderTo(this.context);
        }
    };

    private fixSize = () => {
        const dpi = window.devicePixelRatio;
        const {offsetWidth, offsetHeight} = this.element;
        this.element.width = offsetWidth * dpi;
        this.element.height = offsetHeight * dpi;
    };
}
