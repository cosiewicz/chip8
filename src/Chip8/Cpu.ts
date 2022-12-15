import {Display} from "./Display";


export type Key = {
    keypress: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined | null
}

export type FunctionChip8 = {
    func: Function;
    child: FunctionChip8[];
}


export class Cpu {

    public static readonly MEMORY_OFFSET = 0x600;
    public static readonly MEMORY_SIZE = 0xFFF;
    public static readonly MEMORY_PROG_START = 0x200;
    public static readonly MEMORY_PRO_END = 0x5FFF;
    public static readonly MEMORY_INTERPRETER_START = 0x000;
    public static readonly MEMORY_INTERPRETER_END = 0x1FF;


    public static readonly V_SIZE = 15;

    private _memory: Uint8Array;
    private registerV: Uint8Array;
    private registerI: number;
    private registerDT: number;
    private registerST: number;
    private registerVF: number;
    private stack: number[];
    private _cp: number;
    private runId: number;
    private runIsPaused: boolean;
    private display: Display;
    private key: Key;

    constructor(display: Display) {
        this._memory = new Uint8Array(Cpu.MEMORY_SIZE);
        this.registerV = new Uint8Array(Cpu.V_SIZE);
        this.registerI = 0;
        this.registerDT = 0;
        this.registerST = 0;
        this.registerVF = 0;
        this._cp = 0;
        this.stack = [];
        this.initInterpreter();
        this.runId = 0;
        this.runIsPaused = false;
        this.display = display;
        this.key = {keypress: null}
    }

    get cp(): number {
        return this._cp;
    }

    set cp(value: number) {
        this._cp = value;
    }

    public getNNN(instruction: number): number {
        return (instruction & 0x0FFF);
    }

    public getN(instruction: number): number {
        return (instruction & 0x000F);
    }

    public getX(instruction: number): number {
        return ((instruction & 0x0F00) >> 8);
    }

    public getY(instruction: number): number {
        return ((instruction & 0x00F0) >> 4);
    }

    public getKK(instruction: number): number {
        return (instruction & 0x00FF);
    }

    public getMemory() {
        return (this._memory[this._cp] << 8) + this._memory[this._cp + 1];
    }

    public next() {
        this._cp += 2;
    }

    public _00E0() {
        console.log("CLS");
        this.display.clearDisplay();
        this.next();
    }

    public _00EE() {

        const unstackPointer = this.stack.shift();
        if (unstackPointer === undefined) {
            throw Error("first stack is undefined");
        }
        this._cp = unstackPointer + 2;
        console.log("RET " + unstackPointer.toString(16));
    }

    public _1NNN() {
        this._cp = this.getNNN(this.getMemory());
        console.log("JP " + this._cp.toString(16))
    }

    public _2NNN() {
        this.stack.push(this._cp);
        console.log("ADD STACK " + this._cp.toString(10))
        this._cp = this.getNNN(this.getMemory());
        console.log("CALL " + this._cp.toString(10))
    }

    public _3XKK() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const kk = this.getKK(instruction);
        if (this.registerV[x] === kk) {
            this.next();
        }
        this.next();
        console.log("SE " + x.toString(16) + " , " + kk.toString(16))
    }

    public _4XKK() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const kk = this.getKK(instruction);
        if (this.registerV[x] !== kk) {
            this.next();
        }
        this.next();
        console.log("SNE " + x.toString(16) + " , " + kk.toString(16))
    }

    public _5XY0() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        if (this.registerV[x] === this.registerV[y]) {
            this.next();
        }
        this.next();
        console.log("SE " + x.toString(16) + " , " + y.toString(16))
    }

    public _6xKK() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const kk = this.getKK(instruction);
        this.registerV[x] = kk;
        this.next();
        console.log("LD " + x.toString(16) + " , " + kk.toString(16))
    }

    public _7XKK() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const kk = this.getKK(instruction);
        this.registerV[x] += kk;
        this.next();
        console.log("ADD " + x.toString(16) + " , " + kk.toString(16))
    }

    public _8XY0() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        this.registerV[x] = this.registerV[y];
        this.next();
        console.log("LD " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XY1() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        this.registerV[x] = (this.registerV[x] | this.registerV[y]);
        this.next();
        console.log("OR  " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XY2() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        this.registerV[x] = (this.registerV[x] & this.registerV[y]);
        this.next();
        console.log("AND " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XY3() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        const xor = this.registerV[x] ^ this.registerV[y];
        // this.registerV[x] =
        this.registerVF = +(xor !== (this.registerV[x] | this.registerV[y]))
        this.registerV[x] = xor;
        this.next();
        console.log("XOR " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XY4() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        const add = this.registerV[x] + this.registerV[y];
        if (add > 255) {
            this.registerVF = 1;
        } else {
            this.registerVF = 0;
        }
        this.registerV[x] = add & 0x00FF;
        this.next();
        console.log("ADD " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XY5() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        if (this.registerV[x] < this.registerV[y]) {
            this.registerVF = 1;
        } else {
            this.registerVF = 0;
        }
        this.registerV[x] -= this.registerV[y];
        this.next();
        console.log("SUB " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XY6() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        this.registerVF = this.registerV[x] & 0x1;

        this.registerV[x] >>= 1;
        this.next();
        console.log("SHR " + x.toString(16))
    }

    public _8XY7() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        if (this.registerV[x] > this.registerV[y]) {
            this.registerVF = 1;
        } else {
            this.registerVF = 0;
        }
        this.registerV[x] = this.registerV[y] - this.registerV[x];
        this.next();
        console.log("SUBN " + x.toString(16) + " , " + y.toString(16))
    }

    public _8XYE() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        this.registerVF = this.registerV[x] & 0x80;

        this.registerV[x] <<= 1;
        this.next();
        console.log("SHL " + x.toString(16))
    }

    public _9XY0() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);

        if (this.registerV[x] !== this.registerV[y]) {
            this.next();
        }
        this.next();
        console.log("SNE " + x.toString(16) + " , " + y.toString(16))
    }


    public _ANNN() {
        this.registerI = this.getNNN(this.getMemory());
        this.next();
        console.log("LD " + this.registerI.toString(16));
    }

    public _BNNN() {
        this._cp = this.getNNN(this.getMemory()) + this.registerV[0];
        console.log("JP " + this._cp.toString(16));
    }

    public _CXKK() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const kk = this.getKK(instruction);
        this.registerV[x] = Math.floor(Math.random() * 256) & kk;
        this.next();
        console.log("RND " + x.toString(16) + " , " + kk.toString(16))
    }

    public _DXYN() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);
        const y = this.getY(instruction);
        const n = this.getN(instruction);
        const sprite =  this._memory.slice(this.registerI,this.registerI+n);

        this.registerVF = this.display.drawSprite(this.registerV[x], this.registerV[y], {data: sprite})
        this.next();
        console.log("DRW " + x.toString(16) + " , " + y.toString(16), +" ", n)
    }

    public _EX9E() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        if (x === this.key.keypress) {
            this.next();
        }
        this.next();
        console.log("SKP  " + x.toString(16));
    }

    public _EXA1() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        if (x !== this.key.keypress) {
             this.next();
        }
        this.next();
        console.log("SKP  " + x.toString(16));
    }

    public _FX15() {
        const x = this.getX(this.getMemory());
        this.registerDT = this.registerV[x];
        this.next();
        console.log("LD DT " + x.toString(16));
    }

    public _Fx07() {
        const x = this.getX(this.getMemory());
        this.registerV[x] = this.registerDT;
        this.next();
    }

    public _FX18() {
        const x = this.getX(this.getMemory());
        this.registerST = this.registerV[x];
        this.next();
        console.log("LD ST " + x.toString(16));
    }

    public _FX1E() {
        const x = this.getX(this.getMemory());
        this.registerI += this.registerV[x];
        this.next();
        console.log("ADD I " + x.toString(16));
    }

    public _FX29() {
        const x = (this.getX(this.getMemory()));
        this.registerI = Cpu.MEMORY_INTERPRETER_START + this.registerV[x] * 5;
        this.next();
    }

    public _FX33() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        this._memory[this.registerI + 2] = this.registerV[x] % 10;
        this.registerV[x] /= 10;

        this._memory[this.registerI + 1] = this.registerV[x] % 10;
        this.registerV[x] /= 10;

        this._memory[this.registerI] = this.registerV[x] % 10;
        this.next();
    }

    public _FX55() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        for (let i = 0; i <= x; i++) {
            this.registerV[this.registerI + 1] = this._memory[this.registerI];
        }
        this.next();
    }

    public _FX65() {
        const instruction = this.getMemory();
        const x = this.getX(instruction);

        for (let i = 0; i <= x; i++) {
            this.registerV[this.registerI] = this._memory[this.registerI + i];
        }
        this.next();
    }


    public initInterpreter() {
        const interpreterData = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80, // F
        ]
        for (let i = 0; i < interpreterData.length; i++) {
            this._memory[Cpu.MEMORY_INTERPRETER_START + i] = interpreterData[i];
        }
    }

    public static convertValueToBitsArray(value: number): number[] {
        let array: number[] = [];
        for (let i = 0; i < 8; i++) {
            array.push(value >> i & 1);

        }
        return array.reverse();
    }


    public run(delay: number) {
        this.runId = setInterval(() => {

            //console.log("cp : " + this._cp)
            const memory = this.getMemory();
            const f = memory >> 12;
            const _4bits = memory & 0xF;
            const _8bits = memory & 0xFF;
            this.display.draw();
            console.log(memory.toString(16))

            switch (f) {

                case 0x0:
                    switch (_4bits) {
                        /*
                            Clear the display.
                        */
                        case 0x0:
                            this._00E0()
                            break;

                        /*
                            Return from a subroutine.
                            The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
                        */
                        case 0xE:
                            this._00EE()
                            break;
                    }
                    break;
                /*
                    Jump to location nnn.
                    The interpreter sets the program counter to nnn.
                 */
                case 0x1:
                    this._1NNN();
                    break;
                case 0x2:
                    this._2NNN();
                    break;
                case 0x3:
                    this._3XKK();
                    break;
                case 0x4:
                    this._4XKK();
                    break;
                case 0x5:
                    this._5XY0()
                    break;
                case 0x6:
                    this._6xKK()
                    break;
                case 0x7:
                    this._7XKK();
                    break;
                case 0x8:
                    switch (_4bits) {
                        case 0x0:
                            this._8XY0();
                            break;
                        case 0x1:
                            this._8XY1();
                            break;
                        case 0x2:
                            this._8XY2();
                            break;
                        case 0x3:
                            this._8XY3();
                            break;
                        case 0x4:
                            this._8XY4();
                            break;
                        case 0x5:
                            this._8XY5();
                            break;
                        case 0x6:
                            this._8XY6();
                            break;
                        case 0x7:
                            this._8XY7()
                            break;
                        case 0xE:
                            this._8XYE();
                            break;
                    }
                    break;
                case 0x9:
                    this._9XY0();
                    break;
                case 0xA:
                    this._ANNN();
                    break;
                case 0xB:
                    this._BNNN();
                    break;
                case 0xC:
                    this._CXKK();
                    break;
                case 0xD:
                    this._DXYN();
                    break;
                case 0xE:
                    switch (_4bits) {
                        case 0xE:
                            this._EX9E();
                            break;
                        case 0x1:
                            this._EXA1();
                            break;
                    }
                    break;
                case 0xF:
                    switch (_8bits) {
                        case 0x07:
                            this._Fx07();
                            break;
                        case 0x15:
                            this._FX15()
                            break;
                        case 0x18:
                            this._FX18();
                            break;
                        case 0x1E:
                            this._FX1E();
                            break;
                        case 0x29:
                            this._FX29();
                            break;
                        case 0x33:
                            this._FX33();
                            break;
                        case 0x55:
                            this._FX55();
                            break;
                        case 0x65:
                            this._FX65();
                            break;
                    }
                    break;
            }

            if (!this.runIsPaused) {
                if (this.registerDT > 0) {
                    this.registerDT--;
                }
                if (this.registerST > 0) {
                    this.registerST--;
                }
            }
        }, delay)
    }

    public stop() {
        clearInterval(this.runId);
    }

    public start() {
        this.runIsPaused = false;
    }

    public pause() {
        this.runIsPaused = true;
    }


    get memory(): Uint8Array {
        return this._memory;
    }

    set memory(value: Uint8Array) {
        this._memory = value;
    }
}