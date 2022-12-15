import {Chip8} from "./Chip8/Chip8";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const chip :Chip8 = new Chip8(ctx);

async function chip8(){
    await chip.loadGame("Airplane.ch8");

    chip.run(1000/255);
}





chip8();
