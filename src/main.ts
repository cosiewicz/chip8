import {Chip8} from "./Chip8/Chip8";


const chip :Chip8 = new Chip8();


async function chip8(){
    await chip.loadGame("Airplane.ch8");
    chip.run(100);
}

chip8();
