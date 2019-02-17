import Container = PIXI.Container;
import DisplayObject = PIXI.DisplayObject;

export interface ExplicitContainer<T extends DisplayObject> extends Container {
    children: T[];
}
