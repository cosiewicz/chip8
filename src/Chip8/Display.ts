import {Cpu} from "./Cpu";

export type Sprite = {
    data: number[];
}

export class Display {

    public static readonly HEIGHT = 32;
    public static readonly WIDTH = 64;

    private screenArray: boolean[][];

    constructor() {
        this.screenArray=[[]];
        this.clearDisplay();
    }


    public clearDisplay() {
        this.screenArray = Array(Display.HEIGHT).fill(0).map(() => Array(Display.WIDTH).fill(false));
    }

    public drawSprite(x: number, y: number, sprite: Sprite):number {
        let posX = x;
        let posY = y;
        let flag=0;
        sprite.data.forEach((value) => {
            let byte: number[] = Cpu.convertValueToBitsArray(value);
            for (let i = 0; i < 8; i++) {
                let b = false;
                if (byte[i] === 1) {
                    b = true;
                }
                if (posX > Display.WIDTH) {
                    posX = 0;
                }
                console.log(posY);
                if (this.screenArray[posY][posX] && b) {
                    this.screenArray[posY][posX] = false;
                    flag=1;
                } else {
                    this.screenArray[posY][posX] = b;
                }
            }
            posY++;
        })
        return flag;
    }

}