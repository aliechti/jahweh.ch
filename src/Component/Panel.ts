import Graphics = PIXI.Graphics;
import Point = PIXI.Point;
import {Player} from './Game';
import {Territory} from './Territory';

export interface PanelProps {
    w: number;
    h: number;
    lineWidth?: number;
    fillColor?: number;
    lineColor?: number;
    lineAlignment?: number;
}

export class Panel extends Graphics {
    private props: PanelProps;
    private money: PIXI.Text;

    constructor(props: PanelProps) {
        super();
        this.props = props;
        this.draw();
        this.money = new PIXI.Text('0');
        this.money.position = new Point(10, 10);
        this.addChild(this.money);
    }

    public setPlayer(player: Player) {
        const color = player.hexagonProps.fillColor;
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
