export class Viaje {
  constructor(
    public id: string,
    public idcliente: string,
    public origen: string,
    public destino: string,
    public fecha: Date,
    public precio: number
  ) {}
}
