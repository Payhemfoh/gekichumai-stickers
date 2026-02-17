import { Character } from "./Character";

export class Category {
    constructor(
        public name: string,
        public characters: Array<Character>
    ){}
}