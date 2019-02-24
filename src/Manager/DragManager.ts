import {Unit} from '../Component/Unit';
import DisplayObject = PIXI.DisplayObject;
import RenderTexture = PIXI.RenderTexture;
import Texture = PIXI.Texture;

interface Props {
    container: HTMLElement;
    moveEventContainer: HTMLElement;
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
    private lastPosition: { x: number, y: number };

    constructor(props: Props) {
        this.props = props;
        this.zoom = 1;
        this.lastPosition = {x: 0, y: 0};
    }

    private handleMove = (e: PointerEvent) => {
        if (this._dragging) {
            const {image} = this._dragging;
            this.setImagePosition(image, e.clientX, e.clientY);
        }
    };

    private setImagePosition(image: HTMLImageElement, x: number, y: number) {
        const {resolution} = this.props;
        this.setCalculatedImagePosition(image, x * resolution / this._zoom, y * resolution / this._zoom);
    }

    private setCalculatedImagePosition(image: HTMLImageElement, x: number, y: number) {
        image.style.left = x + 'px';
        image.style.top = y + 'px';
        this.lastPosition = {x, y};
    }

    get dragging(): Unit | undefined {
        return (this._dragging ? this._dragging.unit : undefined);
    }

    set dragging(unit: Unit | undefined) {
        const {container, moveEventContainer, extractImage} = this.props;
        // Remove currently dragging
        if (this._dragging !== undefined) {
            const {unit, image, interactive} = this._dragging;
            moveEventContainer.removeEventListener('mousemove', this.handleMove);
            // Reset unit interactivity and visibility
            if (unit.canMove) {
                unit.interactive = interactive;
            }
            unit.visible = true;
            if (image) {
                container.removeChild(image);
            }
            this._dragging = undefined;
        }
        // Set currently dragging
        if (unit) {
            const image = extractImage(unit.texture);
            image.classList.add('click-trough');
            image.style.position = 'absolute';
            image.style.transform = 'translate(-50%, -50%)';
            if (unit.props.field) {
                const {resolution} = this.props;
                // If the unit has a field, it's from the canvas with the same zoom ratio, but without the resolution
                this.setCalculatedImagePosition(image, unit.x * resolution, unit.y * resolution);
            } else {
                this.setImagePosition(image, unit.x, unit.y);
            }
            this._dragging = {
                unit,
                image,
                interactive: unit.interactive,
            };
            unit.interactive = false;
            unit.visible = false;
            container.appendChild(this._dragging.image);
            moveEventContainer.addEventListener('mousemove', this.handleMove);
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
        if (this._dragging) {
            this.setImagePosition(this._dragging.image, this.lastPosition.x, this.lastPosition.y);
        }
    }
}
