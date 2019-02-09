import {HexagonField} from './HexagonField';
import {Player} from './Game';

export interface TerritoryProps {
    player: Player;
    fields: HexagonField[];
}

const fieldIncome = 2;

export class Territory {

    public props: TerritoryProps;
    public money: number;

    constructor(props: TerritoryProps) {
        this.props = props;
        this.money = 0;
    }

    public onTurn() {
        if (this.isControllable()) {
            this.money += this.income();
            this.money -= this.salaries();
        }
    }

    public isControllable(): boolean {
        return this.props.fields.length > 1;
    }

    public isBankrupt(): boolean {
        return this.money < 0;
    }

    public income(): number {
        return this.props.fields.length * fieldIncome;
    }

    public salaries(): number {
        let salaries = 0;
        for (const field of this.props.fields) {
            const unit = field.unit;
            if (unit) {
                salaries += unit.props.type.salary;
            }
        }
        return salaries;
    }

    public addField(...fields: HexagonField[]): void {
        for (const field of fields) {
            field.territory = this;
            field.player = this.props.player;
        }
        this.props.fields.push(...fields);
    }
}
