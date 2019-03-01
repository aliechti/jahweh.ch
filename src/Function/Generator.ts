import {ChooserProps, PlayerChooser} from '../Component/HexagonGridGenerator';
import {Player} from '../Manager/PlayerManager';

export const chooserRandom: PlayerChooser = (props) => {
    return Math.floor(Math.random() * Math.floor(props.playerCount));
};

export const generateEvenlyChooser = (emptyPercentage: number, players: Player[]): PlayerChooser => {
    function shuffleArray(array: any[]) {
        for (let i = 0; i < array.length; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // todo: emptyPercentage should not create islands
    const fill: (number | undefined)[] = [];

    function generateFill(props: ChooserProps) {
        const emptyCount = props.fieldCount / 100 * emptyPercentage;
        const fieldCount = props.fieldCount - emptyCount;
        fill.push(...Array(Math.floor(emptyCount)).fill(null));
        for (const i in players) {
            fill.push(...Array(Math.floor(fieldCount / players.length)).fill(i));
        }
        shuffleArray(fill);
    }

    let i = 0;
    return (props) => {
        if (i === 0) {
            generateFill(props);
        }
        return fill[i++] || undefined;
    };
};
