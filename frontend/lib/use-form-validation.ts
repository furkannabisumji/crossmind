import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  initialValue: T;
  rules?: ValidationRule<T>[];
};

type FormConfig<T extends Record<string, any>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

type FormState<T extends Record<string, any>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
};

/**
 * Custom hook for form validation with error handling
 * @param config Form configuration with validation rules
 * @returns Form state and handlers
 */
export function useFormValidation<T extends Record<string, any>>(config: FormConfig<T>) {
  // Initialize form state
  const initialValues = Object.entries(config).reduce((acc, [key, field]) => {
    acc[key as keyof T] = field.initialValue;
    return acc;
  }, {} as T);

  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: false,
  });

  // Validate a single field
  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const fieldConfig = config[name];
    if (!fieldConfig.rules) return null;

    for (const rule of fieldConfig.rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }

    return null;
  }, [config]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(config).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, formState.values[fieldName]);
      
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    setFormState(prev => ({
      ...prev,
      errors,
      isValid,
    }));

    return isValid;
  }, [config, formState.values, validateField]);

  // Handle field change
  const handleChange = useCallback((name: keyof T, value: any) => {
    const error = validateField(name, value);

    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
      errors: {
        ...prev.errors,
        [name]: error,
      },
      touched: {
        ...prev.touched,
        [name]: true,
      },
    }));
  }, [validateField]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const touched = Object.keys(config).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      
      setFormState(prev => ({
        ...prev,
        touched,
      }));

      const isValid = validateForm();
      
      if (isValid) {
        onSubmit(formState.values);
      }
    };
  }, [config, formState.values, validateForm]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: false,
    });
  }, [initialValues]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    handleChange,
    handleSubmit,
    resetForm,
    validateForm,
  };
}
