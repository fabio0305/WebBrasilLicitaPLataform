export const PASSWORD_POLICY_MESSAGE =
  "A senha deve conter no minimo 8 caracteres, 1 letra maiuscula, 1 letra minuscula, 1 numero e 1 caractere especial.";

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
