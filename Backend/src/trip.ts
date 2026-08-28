export class Trip {
  constructor(
    public id: string,
    public clientId: string,
    public origin: string,
    public destination: string,
    public date: Date,
    public price: number
  ) {}
}