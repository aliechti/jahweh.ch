import {DisplayObject, RenderTexture} from 'pixi.js';
import {Unit} from '../Component/Unit';

interface Props {
    container: HTMLElement;
    moveEventContainer: HTMLElement;
    resolution: number;

    extractImage(target: DisplayObject | RenderTexture): HTMLImageElement;
}

export class DragManager {
    private props: Props;
    private _dragging?: {
        unit: Unit,
        image: HTMLImageElement,
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

    private setImageScale(image: HTMLImageElement) {
        const {resolution} = this.props;
        const upEffectScale = 1.2;
        const scale = this._zoom / resolution * upEffectScale;
        image.style.transform = `translate(-50%, -50%) scale(${scale})`;
        image.style.opacity = '0.8';
    }

    private setImagePosition(image: HTMLImageElement, x: number, y: number) {
        image.style.left = x + 'px';
        image.style.top = y + 'px';
        this.lastPosition = {x, y};
    }

    getDragging = (): Unit | undefined => {
        return (this._dragging ? this._dragging.unit : undefined);
    };

    setDragging = (unit: Unit | undefined, position?: { x: number, y: number }) => {
        const {container, moveEventContainer, extractImage, resolution} = this.props;
        // Remove currently dragging
        if (this._dragging !== undefined) {
            const {unit, image} = this._dragging;
            moveEventContainer.removeEventListener('mousemove', this.handleMove);
            // Reset unit visibility
            unit.visible = true;
            if (image) {
                container.removeChild(image);
            }
            this._dragging = undefined;
        }
        // Set currently dragging
        if (unit) {
            const image = extractImage(unit.texture as RenderTexture);
            image.classList.add('click-trough');
            image.style.position = 'absolute';
            this.setImageScale(image);
            if (position) {
                this.setImagePosition(image, position.x, position.y);
            }
            this._dragging = {
                unit,
                image,
            };
            unit.visible = false;
            container.appendChild(this._dragging.image);
            moveEventContainer.addEventListener('mousemove', this.handleMove);
        }
    };

    get zoom(): number {
        return this._zoom;
    }

    set zoom(value: number) {
        this._zoom = value;
        if (this._dragging) {
            this.setImageScale(this._dragging.image);
            this.setImagePosition(this._dragging.image, this.lastPosition.x, this.lastPosition.y);
        }
    }
}
