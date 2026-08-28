export class Driver {
  constructor(
    public id?: string,
    public dni?: string,
    public firstName?: string,
    public lastName?: string,
    public phone?: string,
    public active: number = 1
  ) {}
}
