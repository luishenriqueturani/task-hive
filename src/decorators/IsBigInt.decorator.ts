import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ async: false })
export class IsBigIntConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    try {
      BigInt(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'O valor fornecido não é um BigInt válido!';
  }
}

export function IsBigInt(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBigIntConstraint,
    });
  };
}