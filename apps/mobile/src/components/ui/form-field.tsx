import { PasswordField, TextField, type TextFieldProps } from './fields';
type StringField = {
  state: { value: string; meta: { errors: unknown[] } };
  handleChange: (value: string) => void;
  handleBlur: () => void;
};
export function FormTextField({
  field,
  kind = 'name',
  ...props
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> & {
  field: StringField;
  kind?: 'username' | 'password' | 'name';
}) {
  const error = field.state.meta.errors
    .map((error) =>
      typeof error === 'string'
        ? error
        : ((error as { message?: string })?.message ?? 'Check this field'),
    )
    .join('. ');
  const Component = kind === 'password' ? PasswordField : TextField;
  return (
    <Component
      autoCapitalize={kind === 'name' ? 'words' : 'none'}
      autoCorrect={kind === 'name'}
      {...props}
      error={error}
      value={field.state.value}
      onChangeText={field.handleChange}
      onBlur={field.handleBlur}
    />
  );
}
