import Container = PIXI.Container;
import InteractionEvent = PIXI.interaction.InteractionEvent;

interface Props {
    shouldStart?: (e: InteractionEvent) => boolean;
}

export class PanContainer extends Container {
    private panStart?: { x: number, y: number };
    private props: Props;

    constructor(props: Props) {
        super();
        this.props = props;
        this.interactive = true;
        this.on('mousedown', this.handleStart);
        this.on('mouseup', this.handleEnd);
        this.on('mouseupoutside', this.handleEnd);
        this.on('touchstart', this.handleStart);
        this.on('touchend', this.handleEnd);
        this.on('touchendoutside', this.handleEnd);
    }

    private handleStart = (e: InteractionEvent) => {
        const {shouldStart} = this.props;
        if (shouldStart && !shouldStart(e)) {
            return;
        }
        this.on('mousemove', this.handlePanMove);
        this.on('touchmove', this.handlePanMove);
    };

    private handleEnd = (e: InteractionEvent) => {
        this.panStart = undefined;
        this.off('mousemove', this.handlePanMove);
        this.off('touchmove', this.handlePanMove);
    };

    private handlePanMove = (e: InteractionEvent) => {
        const mouse = {x: e.data.global.x, y: e.data.global.y};
        if (this.panStart === undefined) {
            this.panStart = {x: mouse.x - this.x, y: mouse.y - this.y};
        }
        this.x = mouse.x - this.panStart.x;
        this.y = mouse.y - this.panStart.y;
    };

}
