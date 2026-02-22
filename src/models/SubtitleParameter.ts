export class SubtitleParameter {
  constructor(
    public text: string,
    public fillColor: string, 
    public strokeColor: string, 
    public x: number,
    public y: number,
    public r: number,
    public s: number,
    public spaceSize: number
  ) {}

  // Generic immutable update method
  update(updates: Partial<SubtitleParameter>): SubtitleParameter {
    return new SubtitleParameter(
      updates.text ?? this.text,
      updates.fillColor ?? this.fillColor,
      updates.strokeColor ?? this.strokeColor,
      updates.x ?? this.x,
      updates.y ?? this.y,
      updates.r ?? this.r,
      updates.s ?? this.s,
      updates.spaceSize ?? this.spaceSize
    );
  }
}
