import SystemRenderer = PIXI.SystemRenderer;
import Graphics = PIXI.Graphics;
import Texture = PIXI.Texture;
import Point = PIXI.Point;
import {UnitType} from './Unit';

interface Props {
    renderer: SystemRenderer;
}

interface UnitTypeDefinition extends Pick<UnitType, Exclude<keyof UnitType, 'texture'>> {
    texture: 'circle' | 'square' | 'line' | 'line-2' | 'line-3' | 'line-4';
}

const mainBuildingDefinition: UnitTypeDefinition = {
    name: 'Gym',
    strength: 1,
    cost: 0,
    salary: 0,
    isBuildable: false,
    isMovable: false,
    texture: 'circle',
};

const unitTypeDefinitions: UnitTypeDefinition[] = [
    mainBuildingDefinition,
    {
        name: 'Instructor',
        strength: 2,
        cost: 15,
        salary: 0,
        isBuildable: true,
        isMovable: false,
        texture: 'square',
    }, {
        name: 'Leek',
        strength: 1,
        cost: 10,
        salary: 2,
        isBuildable: true,
        isMovable: true,
        texture: 'line',
    }, {
        name: 'Gym Bro',
        strength: 2,
        cost: 20,
        salary: 6,
        isBuildable: true,
        isMovable: true,
        texture: 'line-2',
    }, {
        name: 'Bodybuilder',
        strength: 3,
        cost: 30,
        salary: 18,
        isBuildable: true,
        isMovable: true,
        texture: 'line-3',
    }, {
        name: 'Strongman',
        strength: 4,
        cost: 40,
        salary: 56,
        isBuildable: true,
        isMovable: true,
        texture: 'line-4',
    },
];

export class UnitTypeManager {
    private props: Props;
    public readonly units: UnitType[];
    public readonly mainBuilding: UnitType;

    constructor(props: Props) {
        this.props = props;
        this.mainBuilding = this.definitionToUnitType(mainBuildingDefinition);
        this.units = [];
        for (const definition of unitTypeDefinitions) {
            this.units.push(this.definitionToUnitType(definition));
        }
    }

    private definitionToUnitType(definition: UnitTypeDefinition): UnitType {
        return {...definition, texture: this.definitionToTexture(definition.texture)};
    }

    private definitionToTexture(definition: string): Texture {
        switch (definition) {
            case 'circle':
            default:
                return this.textureCircle();
        }
    }

    private textureCircle(): Texture {
        const graphics = new Graphics();
        graphics.beginFill(0x6789AB);
        graphics.drawCircle(0, 0, 10);
        graphics.endFill();
        const texture = this.props.renderer.generateTexture(graphics);
        texture.defaultAnchor = new Point(0.5, 0.5);
        return texture;
    }
}
