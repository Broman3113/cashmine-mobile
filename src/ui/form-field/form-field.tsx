import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, type FieldProps } from '@/ui/field';

type ControlledProps = 'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref';

export type FormFieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> = Omit<
  FieldProps,
  ControlledProps
> & {
  control: Control<TValues>;
  name: TName;
};

/**
 * Field connected to react-hook-form. The form owns value, touched state and errors;
 * this component only maps them onto Field. Pass `control` explicitly: no form context to nest.
 */
export function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  disabled,
  ...fieldProps
}: FormFieldProps<TValues, TName>) {
  const {
    field: { ref, value, onChange, onBlur, disabled: isFormDisabled },
    fieldState: { error },
  } = useController({ control, name });

  return (
    <Field
      {...fieldProps}
      ref={ref} // lets the form focus the first invalid field on submit
      value={value ?? ''}
      onChangeText={onChange}
      onBlur={onBlur}
      error={error?.message}
      disabled={disabled || isFormDisabled}
    />
  );
}
