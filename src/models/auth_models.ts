//src/models/auth_models.ts
export interface IAuth {
    email: string;
    password: string;
    role?: 'Administrador' | 'Usuario' | 'Empresa' | 'Gobierno';
}