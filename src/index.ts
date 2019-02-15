import {Application} from 'pixi.js';
import {Game} from './Component/Game';
import {ChooserProps, HexagonGridGenerator, PlayerChooser} from './Component/HexagonGridGenerator';

const app = new Application(window.innerWidth, window.innerHeight, {
    antialias: true,
});
document.body.appendChild(app.view);
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

const overlayStart = document.querySelector('.start') as HTMLDivElement;
const overlayInGame = document.querySelector('.in-game') as HTMLDivElement;
document.querySelectorAll('.btn-start').forEach((btn: HTMLButtonElement) => {
    btn.addEventListener('click', () => {
        overlayStart.style.display = 'none';
        overlayInGame.style.display = null;
        startGame();
    });
});

function startGame() {
    app.stage.removeChildren();
    const panelWidth = 250;
    const radius = 25;
    const hexWidth = 2 * radius;
    const hexHeight = Math.sqrt(3) * radius;
    const columns = Math.floor((window.innerWidth - hexWidth / 4 - panelWidth) / (hexWidth * 3 / 4));
    const rows = Math.floor((window.innerHeight - hexHeight * 3 / 4) / hexHeight);
    const players = [
        {
            color: 0xff0088,
        },
        {
            color: 0xff8800,
        },
        {
            color: 0xffff00,
        },
        {
            color: 0x00ffff,
        },
    ];
    const generator = new HexagonGridGenerator({
        players,
        hexagonProps: {
            radius,
            lineWidth: 2,
            lineColor: 0x000000,
        },
        renderer: app.renderer,
    });
    const chooserRandom: PlayerChooser = (props) => {
        return Math.floor(Math.random() * Math.floor(props.playerCount));
    };
    const generateEvenlyChooser = (emptyPercentage: number): PlayerChooser => {
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
    const game = new Game({
        app: app,
        players: generator.props.players,
        grid: generator.ring(4, generateEvenlyChooser(0)),
        panel: {
            w: panelWidth,
            h: window.innerHeight,
            fillColor: 0x112233,
        },
    });
}

startGame();
