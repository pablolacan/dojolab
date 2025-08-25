"use client";

import { Controller } from "react-hook-form";
import { Input, type InputProps } from "./Input";
import { Checkbox, type CheckboxProps } from "./Checkbox";
import { cn } from "../lib/utils";

// Props base para todos los form fields
interface BaseFormFieldProps {
  control: any; // Simplificado para evitar problemas de tipos genéricos
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

// Props específicas para Input Field
interface InputFieldProps extends BaseFormFieldProps {
  type: "input";
  inputProps?: Omit<InputProps, "error" | "value" | "onChange" | "onBlur">;
}

// Props específicas para Checkbox Field
interface CheckboxFieldProps extends BaseFormFieldProps {
  type: "checkbox";
  checkboxProps?: Omit<CheckboxProps, "checked" | "onChange" | "error">;
}

// Union type para todas las variantes
type FormFieldProps = InputFieldProps | CheckboxFieldProps;

/**
 * Componente FormField genérico que integra nuestros UI components con react-hook-form
 */
export function FormField(props: FormFieldProps) {
  const { control, name, label, description, required, className } = props;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const errorMessage = fieldState.error?.message;

        if (props.type === "input") {
          return (
            <div className={cn("space-y-1", className)}>
              <Input
                {...field}
                {...props.inputProps}
                label={label}
                error={hasError}
                helperText={errorMessage || description}
                required={required}
                value={field.value || ""}
              />
            </div>
          );
        }

        if (props.type === "checkbox") {
          return (
            <div className={cn("space-y-1", className)}>
              <Checkbox
                {...props.checkboxProps}
                checked={field.value || false}
                onChange={field.onChange}
                onBlur={field.onBlur}
                label={label}
                description={errorMessage || description}
                error={hasError}
                required={required}
              />
            </div>
          );
        }

        // Fallback para evitar retornar null
        return <div></div>;
      }}
    />
  );
}

// Hook helper para usar FormField más fácilmente
export const useFormField = (control: any, name: string) => {
  return {
    control,
    name,
  };
};

// Componentes específicos para mayor conveniencia
export function InputField(props: Omit<InputFieldProps, "type">) {
  return <FormField {...props} type="input" />;
}

export function CheckboxField(props: Omit<CheckboxFieldProps, "type">) {
  return <FormField {...props} type="checkbox" />;
}

// Export de tipos para usar en otros componentes
export type { FormFieldProps, InputFieldProps, CheckboxFieldProps };