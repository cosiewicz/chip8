import {Cpu} from "./Cpu";
import {Display} from "./Display";

export class Chip8 {

    private cpu: Cpu;
    private display: Display;


    constructor(ctx: CanvasRenderingContext2D) {
        this.display = new Display(ctx);
        this.cpu = new Cpu(this.display);
    }


    public run(delay: number) {
        this.cpu.run(delay)
    }

    public pause() {
        this.cpu.pause();
    }

    public async loadGame(file: string) {
        const response = await fetch('games/' + file);
        const buffer = await response.arrayBuffer();
        this.cpu.memory.set(new Uint8Array(buffer), Cpu.MEMORY_PROG_START);
        this.cpu.cp = Cpu.MEMORY_PROG_START;
        console.log(file + " Loaded!");
    }
}