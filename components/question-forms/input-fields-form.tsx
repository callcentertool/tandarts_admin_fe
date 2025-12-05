"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/SelectInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

interface InputFieldOption {
  name: string;
  placeHolder: {
    en: string;
    dutch: string;
  };
  type: "text" | "number" | "email";
  answer: string;
  validation: {
    isRequired: boolean;
    isRegex: boolean;
    message: string;
    pattern: string | null;
  };
}

interface InputFieldsFormProps {
  fieldName?: string;
  isEdit?: boolean;
}

export function InputFieldsForm({
  fieldName = "options",
  isEdit = false,
}: InputFieldsFormProps) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const addNewOption = async () => {
    const newIndex = fields.length;
    // Generate random name for create mode only
    const randomName = isEdit
      ? ""
      : `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    append({
      name: randomName,
      placeHolder: {
        en: "",
        dutch: "",
      },
      type: "text",
      answer: "",
      validation: {
        isRequired: false,
        isRegex: false,
        message: "",
        pattern: null,
      },
    });
    // Trigger validation after adding option with a small delay to ensure field is registered
    setTimeout(async () => {
      await trigger(`${fieldName}.${newIndex}.name`);
      await trigger(`${fieldName}.${newIndex}.placeHolder.en`);
      await trigger(`${fieldName}.${newIndex}.placeHolder.dutch`);
      await trigger(fieldName);
    }, 100);
  };

  const patternOptions = [
    { value: "text", label: "Text", pattern: ".*" },
    { value: "number", label: "Number", pattern: "^[0-9]+$" },
    { value: "email", label: "Email", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
    { value: "bsn", label: "BSN Number", pattern: "^[0-9]{9}$" },
    { value: "houseNumber", label: "House Number", pattern: "^[0-9]{1,6}[A-Za-z]?$" },
    { value: "phone", label: "Phone Number", pattern: "^(?:0[1-9][0-9]{8}|\\+31[1-9][0-9]{8})$" },
    { value: "postalCode", label: "Postal Code", pattern: "^[0-9]{4}[A-Z]{2}$" },
  ];

  const getPatternValue = (
    isRegex: boolean,
    pattern: string | null,
    type: string
  ) => {
    if (!isRegex) return "";
    if (pattern) return pattern;
    // Return default pattern based on type
    const patternOption = patternOptions.find((opt) => opt.value === type);
    return patternOption?.pattern || ".*";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Input Fields</h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addNewOption}
          className="flex items-center gap-2"
        >
          <Plus size={14} />
          Add Field
        </Button>
      </div>

      {fields.map((field, index) => {
        const isRequired = watch(`${fieldName}.${index}.validation.isRequired`);
        const isRegex = watch(`${fieldName}.${index}.validation.isRegex`);
        const fieldType = watch(`${fieldName}.${index}.type`);

        return (
          <div
            key={field.id}
            className="border rounded-lg p-4 space-y-3 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium">Field {index + 1}</h5>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => remove(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>

            {/* Name Field and Type Dropdown in Single Row */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Field Name*"
                {...register(`${fieldName}.${index}.name`, {
                  required: "Field name is required",
                  validate: (value) => {
                    if (!value || value.trim() === "") {
                      return "Field name is required";
                    }
                    if (value.includes(" ")) {
                      return "Field name cannot contain spaces";
                    }
                    return true;
                  },
                })}
                error={!!(errors?.[fieldName] as any)?.[index]?.name}
                errorMessage={
                  ((errors?.[fieldName] as any)?.[index]?.name?.message as string) ||
                  "Field name is required"
                }
              />
              <Select
                label="Field Type*"
                value={fieldType || "text"}
                onChange={async (e) => {
                  setValue(`${fieldName}.${index}.type`, e.target.value, {
                    shouldValidate: true,
                  });
                  // Update pattern when type changes
                  if (isRegex) {
                    const newPattern = getPatternValue(
                      true,
                      null,
                      e.target.value
                    );
                    setValue(
                      `${fieldName}.${index}.validation.pattern`,
                      newPattern,
                      { shouldValidate: true }
                    );
                  }
                  await trigger(`${fieldName}.${index}.type`);
                }}
                options={patternOptions}
                error={!!(errors?.[fieldName] as any)?.[index]?.type}
                errorMessage={
                  ((errors?.[fieldName] as any)?.[index]?.type?.message as string) ||
                  "Field type is required"
                }
              />
            </div>

            {/* Placeholder Fields */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Placeholder (English)*"
                {...register(`${fieldName}.${index}.placeHolder.en`, {
                  required: "Placeholder (English) is required",
                  validate: (value) => {
                    if (!value || value.trim() === "") {
                      return "Placeholder (English) is required";
                    }
                    return true;
                  },
                })}
                error={!!(errors?.[fieldName] as any)?.[index]?.placeHolder?.en}
                errorMessage={
                  ((errors?.[fieldName] as any)?.[index]?.placeHolder?.en?.message as string) ||
                  "Placeholder (English) is required"
                }
              />
              <Input
                label="Placeholder (Dutch)*"
                {...register(`${fieldName}.${index}.placeHolder.dutch`, {
                  required: "Placeholder (Dutch) is required",
                  validate: (value) => {
                    if (!value || value.trim() === "") {
                      return "Placeholder (Dutch) is required";
                    }
                    return true;
                  },
                })}
                error={!!(errors?.[fieldName] as any)?.[index]?.placeHolder?.dutch}
                errorMessage={
                  ((errors?.[fieldName] as any)?.[index]?.placeHolder?.dutch?.message as string) ||
                  "Placeholder (Dutch) is required"
                }
              />
            </div>

            {/* Validation Section */}
            <div className="space-y-3 pt-2 border-t">
              <h6 className="text-xs font-medium text-gray-700">Validation</h6>

              {/* Checkboxes */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${index}`}
                    checked={isRequired}
                    onCheckedChange={(checked) => {
                      setValue(
                        `${fieldName}.${index}.validation.isRequired`,
                        checked
                      );
                    }}
                  />
                  <label
                    htmlFor={`required-${index}`}
                    className="text-sm cursor-pointer"
                  >
                    Required
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`regex-${index}`}
                    checked={isRegex}
                    onCheckedChange={(checked) => {
                      setValue(
                        `${fieldName}.${index}.validation.isRegex`,
                        checked
                      );
                      if (checked) {
                        const pattern = getPatternValue(true, null, fieldType);
                        setValue(
                          `${fieldName}.${index}.validation.pattern`,
                          pattern
                        );
                      } else {
                        setValue(
                          `${fieldName}.${index}.validation.pattern`,
                          null
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`regex-${index}`}
                    className="text-sm cursor-pointer"
                  >
                    Use Regex
                  </label>
                </div>
              </div>

              {/* Validation Message */}
              {(isRequired || isRegex) && (
                <Input
                  label="Validation Message*"
                  {...register(`${fieldName}.${index}.validation.message`)}
                  error={!!(errors?.[fieldName] as any)?.[index]?.validation?.message}
                  errorMessage={
                    ((errors?.[fieldName] as any)?.[index]?.validation?.message?.message as string) || ""
                  }
                />
              )}

              {/* Pattern Dropdown (when isRegex is true) */}
              {isRegex && (
                <Select
                  label="Pattern Type*"
                  value={
                    getPatternValue(
                      true,
                      watch(`${fieldName}.${index}.validation.pattern`),
                      fieldType
                    ) || "text"
                  }
                  onChange={(e) => {
                    const selectedOption = patternOptions.find((opt) => opt.value === e.target.value);
                    const pattern = selectedOption?.pattern || getPatternValue(true, null, e.target.value);
                    setValue(
                      `${fieldName}.${index}.validation.pattern`,
                      pattern
                    );
                  }}
                  options={patternOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                  error={!!(errors?.[fieldName] as any)?.[index]?.validation?.pattern}
                  errorMessage={
                    ((errors?.[fieldName] as any)?.[index]?.validation?.pattern?.message as string) || ""
                  }
                />
              )}
            </div>
          </div>
        );
      })}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No input fields added. Click "Add Field" to add one.
        </div>
      )}
    </div>
  );
}
