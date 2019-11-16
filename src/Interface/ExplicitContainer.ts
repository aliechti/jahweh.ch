import {Container, DisplayObject} from 'pixi.js';

export interface ExplicitContainer<T extends DisplayObject> extends Container {
    children: T[];
}
