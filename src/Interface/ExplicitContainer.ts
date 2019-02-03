import DisplayObject = PIXI.DisplayObject;
import Container = PIXI.Container;

export interface ExplicitContainer<T extends DisplayObject> extends Container {
    children: T[];
}
