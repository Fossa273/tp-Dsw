export class Cliente {
  constructor(
    public id?: string,
    public nombre?: string,
    public apellido?: string,
    public dni?: string,
    public email?: string,
    public telefono?: string,
    public activo: number = 1,
    public password?: string,
    public logged: number = 0
  ) {}
}
