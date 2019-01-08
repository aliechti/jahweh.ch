export abstract class CanvasObject<Props = undefined> {
    protected props: Props;

    public constructor(props: Props) {
        this.props = props;
    }

    public abstract renderTo(context: CanvasRenderingContext2D): void;
}
