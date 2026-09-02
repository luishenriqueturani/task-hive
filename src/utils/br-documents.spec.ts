import { isValidCnpj, isValidCpf, normalizeCnpj } from './br-documents';

describe('br-documents', () => {
  it('valida CPF e CNPJ numérico', () => {
    expect(isValidCpf('39053344705')).toBe(true);
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCnpj('11444777000161')).toBe(true);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('valida CNPJ alfanumérico (IN RFB 2.229/2024)', () => {
    expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(isValidCnpj('12ABC34501DE00')).toBe(false);
  });
});
