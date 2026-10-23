export function validateDni(value: unknown) {
  const dni = String(value ?? '').trim();
  if (!/^\d+$/.test(dni)) {
    return 'El DNI debe contener solo numeros';
  }
  if (dni.length < 7 || dni.length > 8) {
    return 'El DNI debe tener entre 7 y 8 digitos';
  }
  return null;
}

export function validatePhone(value: unknown) {
  const phone = String(value ?? '').trim();
  if (!/^\d+$/.test(phone)) {
    return 'El telefono debe contener solo numeros';
  }
  if (phone.length < 6) {
    return 'El telefono debe tener al menos 6 digitos';
  }
  if (phone.length > 15) {
    return 'El telefono no puede tener mas de 15 digitos';
  }
  return null;
}

export function validatePersonContact(dni: unknown, phone: unknown) {
  const dniError = validateDni(dni);
  if (dniError) return dniError;
  return validatePhone(phone);
}
