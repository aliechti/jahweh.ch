import Graphics = PIXI.Graphics;
import Point = PIXI.Point;
import Sprite = PIXI.Sprite;
import Texture = PIXI.Texture;
import {Player} from './Game';
import {Territory} from './Territory';
import {UnitType} from './Unit';

export interface PanelProps {
    w: number;
    h: number;
    lineWidth?: number;
    fillColor?: number;
    lineColor?: number;
    lineAlignment?: number;
}

const padding = 10;

export class Panel extends Graphics {
    private props: PanelProps;
    private money: PIXI.Text;

    constructor(props: PanelProps) {
        super();
        this.props = props;
        this.draw();
        this.money = new PIXI.Text('0');
        this.money.position = new Point(padding, padding);
        this.addChild(this.money);
    }

    public setPlayer(player: Player) {
        const color = player.color;
        if (color) {
            this.money.style.fill = color;
        }
    }

    public setTerritory(territory: Territory | undefined) {
        if (territory) {
            this.money.text = String(territory.money);
        } else {
            this.money.text = '0';
        }
    }

    public setUnitTypes(unitTypes: UnitType[], onClick: (type: UnitType) => void) {
        const margin = 10;
        const y = 50 + padding;
        let x = padding;
        for (const type of unitTypes) {
            if (type.isBuildable) {
                const sprite = new Sprite(type.texture);
                const width = sprite.width;
                sprite.y = y;
                sprite.x = x + width / 2;
                x += width + margin;
                sprite.interactive = true;
                sprite.buttonMode = true;
                sprite.on('click', () => {
                    onClick(type);
                });
                this.addChild(sprite);
            }
        }
    }

    public setTurnButton(onClick: () => void, texture: Texture) {
        const button = new Sprite(texture);
        button.x = padding;
        button.y = 100 + padding;
        button.interactive = true;
        button.buttonMode = true;
        button.on('click', onClick);
        this.addChild(button);
    }

    private draw(): void {
        let {w, h, lineWidth, fillColor, lineColor, lineAlignment} = this.props;
        if (fillColor) {
            this.beginFill(fillColor);
        }
        this.lineStyle(lineWidth, lineColor, 1, lineAlignment);
        this.drawRect(0, 0, w, h);
        this.endFill();
    }
}
