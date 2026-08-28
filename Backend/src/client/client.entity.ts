export class Client {
  constructor(
    public id?: string,
    public firstName?: string,
    public lastName?: string,
    public dni?: string,
    public email?: string,
    public phone?: string,
    public active: number = 1,
    public password?: string,
    public logged: number = 0
  ) {}
}