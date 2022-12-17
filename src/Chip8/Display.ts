import {Cpu} from "./Cpu";

export type Sprite = {
    data: ArrayLike<number>;
}

export class Display {

    public static readonly HEIGHT = 32;
    public static readonly WIDTH = 64;
    public static readonly SCALE = 10;
    private ctx: CanvasRenderingContext2D;

    private screenArray: boolean[][];

    constructor(ctx: CanvasRenderingContext2D) {
        this.screenArray = [[]];
        this.clearDisplay();
        this.ctx = ctx;
        this.initCanvas();
    }

    public initCanvas() {
        this.ctx.canvas.width = Display.WIDTH * Display.SCALE;
        this.ctx.canvas.height = Display.HEIGHT * Display.SCALE;
    }

    public clearDisplay() {
        this.screenArray = Array(Display.HEIGHT).fill(0).map(() => Array(Display.WIDTH).fill(false));
    }

    public draw() {

        this.ctx.clearRect(0, 0, Display.WIDTH * Display.SCALE, Display.HEIGHT * Display.SCALE);
        for (let i = 0; i < Display.HEIGHT; i++) {
            for (let j = 0; j < Display.WIDTH; j++) {
                if (this.screenArray[i][j]) {
                    this.ctx.fillRect(j * Display.SCALE, i * Display.SCALE, Display.SCALE, Display.SCALE);
                }
            }
        }
    }

    public drawSprite(x: number, y: number, sprite: Sprite): number {

        let flag = 0;

        for (let posY = 0; posY < sprite.data.length; posY++) {
            let byte: number[] = Cpu.convertValueToBitsArray(sprite.data[posY]);

            for (let posX = 0; posX < byte.length; posX++) {

                const b = byte[posX] === 1;
                const current_pixel = this.screenArray[(posY + y) % Display.HEIGHT][(posX + x) % Display.WIDTH];

                this.screenArray[(posY + y) % Display.HEIGHT][(posX + x) % Display.WIDTH] = (current_pixel || b) &&
                    current_pixel !== b

                if (current_pixel && b) {
                    flag = 1;
                }
            }
        }
        return flag;
    }
}