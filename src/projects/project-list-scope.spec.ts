import { BadRequestException } from '@nestjs/common';
import { parseProjectListScope } from './project-list-scope';

describe('parseProjectListScope', () => {
  it('default é all', () => {
    expect(parseProjectListScope()).toBe('all');
    expect(parseProjectListScope('')).toBe('all');
    expect(parseProjectListScope('all')).toBe('all');
  });

  it('aceita owned e invited', () => {
    expect(parseProjectListScope('owned')).toBe('owned');
    expect(parseProjectListScope('invited')).toBe('invited');
  });

  it('rejeita valores desconhecidos', () => {
    expect(() => parseProjectListScope('other')).toThrow(BadRequestException);
  });
});
