import {CanvasObject} from './CanvasObject';

export interface RectangleProps {
    x: number;
    y: number;
    w: number;
    h: number;
    fillStyle?: string | CanvasGradient | CanvasPattern;
    strokeStyle?: string | CanvasGradient | CanvasPattern;
    lineWidth?: number;
    lineCap?: CanvasLineCap;
}

export class Rectangle extends CanvasObject<RectangleProps> {
    public constructor(props: RectangleProps) {
        super(props);
    }

    public renderTo(context: CanvasRenderingContext2D) {
        const {props} = this;
        Object.keys(props).map((i) => {
            const contextValue: any = (context as any)[i];
            const propsValue: any = (props as any)[i];
            if (contextValue !== undefined) {
                (context as any)[i] = propsValue;
            }
        });
        context.rect(props.x, props.y, props.w, props.h);
        context.fill();
        context.stroke();
        context.restore();
    }
}
