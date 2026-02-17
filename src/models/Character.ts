import { SubtitleParameter } from "./SubtitleParameter";

export class Character {
    constructor(
        public id: string, 
        public name: string, 
        public character: string, 
        public imgPath: string, 
        public fillColor: string, 
        public strokeColor: string, 
        public defaultParam: SubtitleParameter)
    {}
}