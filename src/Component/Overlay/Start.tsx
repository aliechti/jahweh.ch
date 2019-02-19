import * as React from 'react';
import {Chooser, GameOptions, Shape} from '../GameContainer';

interface Props {
    options: GameOptions;
    onClickStart: () => void;
    onSetOptions: (options: GameOptions) => void;
}

const shapes: Shape[] = ['rectangle', 'rhombus', 'ring', 'spiral'];
const choosers: Chooser[] = ['random', 'evenly'];

export class Start extends React.Component<Props> {

    private handleSetOption = (name: keyof GameOptions, value: any) => {
        const {options, onSetOptions} = this.props;
        options[name] = value;
        onSetOptions(options);
    };

    render() {
        const {options, onClickStart} = this.props;
        return (
            <div className="start full">
                <div className="center">
                    <div style={{width: '200px'}}>
                        <label>Shape</label>
                        <select value={options.shape}
                                onChange={(e) => this.handleSetOption('shape', e.target.value)}>
                            {shapes.map((shape) => {
                                return <option key={shape} value={shape}>{shape}</option>;
                            })}
                        </select>
                        <label>Chooser</label>
                        <select value={options.chooser}
                                onChange={(e) => this.handleSetOption('chooser', e.target.value)}>
                            {choosers.map((chooser) => {
                                return <option key={chooser} value={chooser}>{chooser}</option>;
                            })}
                        </select>
                        {options.shape === 'spiral' || options.shape === 'ring'
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
                    </div>
                    <div style={{textAlign: 'center', marginTop: '1rem'}}>
                        <button type="button" onClick={onClickStart}>Start</button>
                    </div>
                </div>
            </div>
        );
    }
}
