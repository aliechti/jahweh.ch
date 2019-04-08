import * as React from 'react';
import {GameOptions, PlayerPicker, Shape} from '../../Function/GameFactory';

interface Props {
    options: GameOptions;
    canResume: boolean;
    onClickStart: () => void;
    onClickResume: () => void;
    onClickReadme: () => void;
    onSetOptions: (options: GameOptions) => void;
}

const shapes: Shape[] = ['rectangle', 'rhombus', 'ring', 'hexagon', 'load'];
const playerPickers: PlayerPicker[] = ['random', 'even'];

export class Start extends React.Component<Props> {

    private handleSetOption = (name: keyof GameOptions, value: any) => {
        const {options, onSetOptions} = this.props;
        options[name] = value;
        onSetOptions(options);
    };

    render() {
        const {options, canResume, onClickStart, onClickResume, onClickReadme} = this.props;
        return (
            <div className="full background-dim row">
                <div className="center">
                    <div style={{width: '10rem'}}>
                        <label>Shape</label>
                        <select value={options.shape}
                                onChange={(e) => this.handleSetOption('shape', e.target.value)}>
                            {shapes.map((shape) => {
                                return <option key={shape} value={shape}>{shape}</option>;
                            })}
                        </select>
                        <label>Player picker</label>
                        <select value={options.playerPicker}
                                onChange={(e) => this.handleSetOption('playerPicker', e.target.value)}>
                            {playerPickers.map((chooser) => {
                                return <option key={chooser} value={chooser}>{chooser}</option>;
                            })}
                        </select>
                        {options.shape === 'load' ? '' :
                            options.shape === 'hexagon' || options.shape === 'ring'
                                ? <>
                                    <label>Radius</label>
                                    <input value={options.radius}
                                           onChange={(e) => this.handleSetOption('radius', Number(e.target.value))}/>
                                </> : <>
                                    <label>Columns</label>
                                    <input value={options.columns}
                                           onChange={(e) => this.handleSetOption('columns', Number(e.target.value))}/>
                                    <label>Rows</label>
                                    <input value={options.rows}
                                           onChange={(e) => this.handleSetOption('rows', Number(e.target.value))}/>
                                </>
                        }
                        <div className="row" style={{marginTop: '0.5rem'}}>
                            <div className="col" style={{textAlign: 'center', marginTop: '0.5rem'}}>
                                <button type="button" onClick={onClickStart}>Start</button>
                            </div>
                            {canResume ?
                                <div className="col" style={{textAlign: 'center', marginTop: '0.5rem'}}>
                                    <button type="button" onClick={onClickResume}>Resume</button>
                                </div>
                                : ''}
                            <div className="col" style={{textAlign: 'center', marginTop: '0.5rem'}}>
                                <button type="button" onClick={onClickReadme}>Readme</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
