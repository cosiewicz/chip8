import {Cpu} from "./Cpu";
import {Display} from "./Display";

export class Chip8 {

    private _cpu: Cpu;
    private display: Display;

    constructor(ctx: CanvasRenderingContext2D) {
        this.display = new Display(ctx);
        this._cpu = new Cpu(this.display);
    }


    get cpu(): Cpu {
        return this._cpu;
    }

    public run(delay: number) {
        this._cpu.run(delay)
    }

    public pause() {
        this._cpu.pause();
    }

    public async loadGame(file: string) {
        const response = await fetch('games/' + file);
        const buffer = await response.arrayBuffer();
        this._cpu.memory.set(new Uint8Array(buffer), Cpu.MEMORY_PROG_START);
        this._cpu.cp = Cpu.MEMORY_PROG_START;
        console.log(file + " Loaded!");
    }
}