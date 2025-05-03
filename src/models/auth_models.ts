

export interface IAuth {
    email: string;
    password: string;
    role?: 'Administrador' | 'Usuario' | 'Empresa' | 'Gobierno';
}