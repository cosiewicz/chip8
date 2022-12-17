import {Chip8} from "./Chip8/Chip8";
import {Key} from "./Chip8/Cpu";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const chip: Chip8 = new Chip8(ctx);

async function chip8() {
    await chip.loadGame("Pong (1 player).ch8    ");

    chip.run(1000 / 60);
}

addEventListener('keydown', (ev) => {
    const key: Key = {keypress: parseInt(ev.key, 16)};
    if(key.keypress>=0 && key.keypress<16){
        chip.cpu.key = key;
    }
})

addEventListener('keyup', () => {
    const key: Key = {keypress: -1};
    chip.cpu.key = key;
})


chip8();
