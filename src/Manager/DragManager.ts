import {Unit} from '../Component/Unit';
import DisplayObject = PIXI.DisplayObject;
import RenderTexture = PIXI.RenderTexture;
import Texture = PIXI.Texture;

interface Props {
    container: HTMLElement;
    resolution: number;

    extractImage(target?: DisplayObject | RenderTexture | Texture): HTMLImageElement;
}

export class DragManager {
    private props: Props;
    private _dragging?: {
        unit: Unit,
        image: HTMLImageElement,
        interactive: boolean,
    };
    private _zoom: number;

    constructor(props: Props) {
        this.props = props;
        this.zoom = 1;
    }

    private handleMove = (e: PointerEvent) => {
        console.log('handleMove', e);
        if (this._dragging) {
            const {image, unit} = this._dragging;
            this.setImagePosition(image, unit);
        }
    };

    private setImagePosition(image: HTMLImageElement, unit: Unit) {
        const {resolution} = this.props;
        image.style.left = (unit.x * resolution) + 'px';
        image.style.top = (unit.y * resolution) + 'px';
        console.log('setImagePosition', unit.x * resolution, unit.x, resolution);
    }

    get dragging(): Unit | undefined {
        return (this._dragging ? this._dragging.unit : undefined);
    }

    set dragging(unit: Unit | undefined) {
        const {container, extractImage} = this.props;
        // Remove currently dragging
        if (this._dragging !== undefined) {
            const {unit, image, interactive} = this._dragging;
            console.log('remove mousemove');
            container.removeEventListener('mousemove', this.handleMove);
            // Reset unit interactivity and visibility
            unit.interactive = interactive;
            unit.visible = true;
            if (image) {
                container.removeChild(image);
            }
            this._dragging = undefined;
        }
        // Set currently dragging
        if (unit) {
            console.log(unit.texture);
            const image = extractImage(unit.texture);
            image.style.position = 'absolute';
            image.style.transform = 'translate(-50%, -50%)';
            this.setImagePosition(image, unit);
            this._dragging = {
                unit,
                image,
                interactive: unit.interactive,
            };
            unit.interactive = false;
            unit.visible = false;
            container.appendChild(this._dragging.image);
            console.log('add mousemove');
            container.addEventListener('mousemove', this.handleMove);
        }
    }

    get zoom(): number {
        return this._zoom;
    }

    set zoom(value: number) {
        const {container, resolution} = this.props;
        this._zoom = value;
        const scale = this._zoom / resolution;
        container.style.transform = `scale(${scale})`;
        container.style.width = `${1 / scale * 100}%`;
        container.style.height = `${1 / scale * 100}%`;
    }
}
