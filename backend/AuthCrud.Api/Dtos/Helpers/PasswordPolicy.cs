using System.Text.RegularExpressions;

namespace AuthCrud.Api.Helpers;

public static class PasswordPolicy
{
    public static bool IsValid(string password, out string error)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            error = "La contraseña es obligatoria.";
            return false;
        }

        if (password.Length < 8)
        {
            error = "La contraseña debe tener al menos 8 caracteres.";
            return false;
        }

        if (!Regex.IsMatch(password, "[A-Z]"))
        {
            error = "La contraseña debe incluir al menos una letra mayúscula.";
            return false;
        }

        if (!Regex.IsMatch(password, "[a-z]"))
        {
            error = "La contraseña debe incluir al menos una letra minúscula.";
            return false;
        }

        if (!Regex.IsMatch(password, "[0-9]"))
        {
            error = "La contraseña debe incluir al menos un número.";
            return false;
        }

        if (!Regex.IsMatch(password, "[^a-zA-Z0-9]"))
        {
            error = "La contraseña debe incluir al menos un carácter especial.";
            return false;
        }

        error = string.Empty;
        return true;
    }
}