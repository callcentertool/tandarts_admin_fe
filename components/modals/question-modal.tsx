"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/SelectInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { fetchQuestionById } from "@/services/questions.service";
import { InputFieldsForm } from "@/components/question-forms/input-fields-form";
import { toast } from "@/hooks/use-toast";

// Question types - full list
const ALL_QUESTION_TYPES = [
  { value: "boolean", label: "Boolean" },
  { value: "selection", label: "Selection" },
  { value: "newComplain", label: "New Complaint" },
  { value: "inputFields", label: "Input Fields" },
  { value: "result", label: "Result" },
];

// Question types - restricted for child questions
const RESTRICTED_QUESTION_TYPES = [
  { value: "inputFields", label: "Input Fields" },
  { value: "selection", label: "Selection" },
  { value: "boolean", label: "Boolean" },
];

// Validation schema
const createQuestionSchema = (isEdit: boolean) => {
  return yup.object({
    type: yup.string().required("Question type is required"),
    mainText: yup.object({
      en: yup.string().when("type", {
        is: "result",
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required("English text is required"),
      }),
      dutch: yup.string().when("type", {
        is: "result",
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required("Dutch text is required"),
      }),
    }),
    placeholder: yup.object({
      en: yup.string(),
      dutch: yup.string(),
    }).optional(),
    options: yup.array().when("type", {
      is: (val: string) => ["selection", "boolean", "inputFields"].includes(val),
      then: (schema) => schema.min(1, "At least one option is required"),
      otherwise: (schema) => schema.optional(),
    }),
    paragraphs: yup.array().when("type", {
      is: "result",
      then: (schema) => schema.min(1, "At least one paragraph is required"),
      otherwise: (schema) => schema.optional(),
    }),
    points: yup.array().optional(),
    urgency: yup.string().when("type", {
      is: "result",
      then: (schema) => schema.required("Urgency is required"),
      otherwise: (schema) => schema.optional(),
    }),
    action: yup.object({
      name: yup.object({
        en: yup.string().optional(),
        dutch: yup.string().optional(),
      }),
      nextId: yup.string().nullable(),
    }).nullable().optional(),
  });
};

type QuestionFormData = {
  type: string;
  mainText: {
    en: string;
    dutch: string;
  };
  placeholder?: {
    en: string;
    dutch: string;
  };
  options?: any[];
  paragraphs?: Array<{
    en: string;
    dutch: string;
  }>;
  points?: Array<{
    en: string;
    dutch: string;
  }>;
  urgency?: string;
  action?: {
    name: {
      en: string;
      dutch: string;
    };
    nextId: string | null;
  };
};

interface QuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string | null;
  parentId?: string | null;
  childId?: string | null;
  allQuestions: any[];
  onSubmit: (data: any) => void;
}

export function QuestionModal({
  open,
  onOpenChange,
  questionId,
  parentId,
  childId,
  allQuestions,
  onSubmit,
}: QuestionModalProps) {
  const isEdit = !!questionId;
  const [isLoading, setIsLoading] = useState(false);
  const [questionData, setQuestionData] = useState<any>(null);

  const methods = useForm<any>({
    resolver: yupResolver(createQuestionSchema(isEdit)) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
    defaultValues: {
      type: "",
      mainText: {
        en: "",
        dutch: "",
      },
      placeholder: {
        en: "",
        dutch: "",
      },
      options: [],
      paragraphs: [],
      points: [],
      urgency: "low",
      action: {
        name: {
          en: "Next",
          dutch: "Volgende",
        },
        nextId: null,
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    control,
    trigger,
  } = methods;

  const questionType = watch("type");
  const isBoolean = questionType === "boolean";
  const isSelection = questionType === "selection";
  const isInputFields = questionType === "inputFields";
  const isNewComplain = questionType === "newComplain";
  const isResult = questionType === "result";

  // Fetch question data when modal opens in edit mode
  useEffect(() => {
    if (open && isEdit && questionId) {
      setIsLoading(true);
      fetchQuestionById(questionId)
        .then((data) => {
          if (data?.data) {
            setQuestionData(data.data);
            const question = data.data;
            
            // Prepare form data
            const formData: QuestionFormData = {
              type: question.type || "",
              mainText: {
                en: question.mainText?.en || "",
                dutch: question.mainText?.dutch || "",
              },
              placeholder: question.placeholder || {
                en: "",
                dutch: "",
              },
              options: question.options || [],
              paragraphs: question.paragraphs || [],
              points: question.points || [],
              urgency: question.urgency || "low",
              action: question.action || {
                name: {
                  en: "Next",
                  dutch: "Volgende",
                },
                nextId: null,
              },
            };

            reset(formData as any);
          }
        })
        .catch((err) => {
          console.error("Error fetching question:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (open && !isEdit) {
      // Reset form for create mode
      reset({
        type: "",
        mainText: {
          en: "",
          dutch: "",
        },
        placeholder: {
          en: "",
          dutch: "",
        },
        options: [],
        paragraphs: [],
        points: [],
        urgency: "low",
        action: {
          name: {
            en: "Next",
            dutch: "Volgende",
          },
          nextId: parentId && childId ? childId : null,
        },
      });
      setQuestionData(null);
      // If parentId exists, the Boolean options will be initialized in the useEffect
    }
  }, [open, isEdit, questionId, reset]);

  // Custom validation function
  const validateForm = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate question type
    if (!data.type) {
      errors.push("Question type is required");
    }

    // Validate mainText (except for result type)
    if (data.type !== "result") {
      if (!data.mainText?.en || data.mainText.en.trim() === "") {
        errors.push("Question (English) is required");
      }
      if (!data.mainText?.dutch || data.mainText.dutch.trim() === "") {
        errors.push("Question (Dutch) is required");
      }
    }

    // Validate based on question type
    if (data.type === "newComplain") {
      if (!data.placeholder?.en || data.placeholder.en.trim() === "") {
        errors.push("Placeholder (English) is required");
      }
      if (!data.placeholder?.dutch || data.placeholder.dutch.trim() === "") {
        errors.push("Placeholder (Dutch) is required");
      }
    } else if (data.type === "result") {
      if (!data.paragraphs || !Array.isArray(data.paragraphs) || data.paragraphs.length === 0) {
        errors.push("At least one paragraph is required");
      } else {
        data.paragraphs.forEach((para: any, index: number) => {
          if (!para || typeof para !== "object") {
            errors.push(`Paragraph ${index + 1} is invalid`);
            return;
          }
          if (!para.en || (typeof para.en === "string" && para.en.trim() === "")) {
            errors.push(`Paragraph ${index + 1} (English) is required`);
          }
          if (!para.dutch || (typeof para.dutch === "string" && para.dutch.trim() === "")) {
            errors.push(`Paragraph ${index + 1} (Dutch) is required`);
          }
        });
      }
      if (!data.urgency || (typeof data.urgency === "string" && data.urgency.trim() === "")) {
        errors.push("Urgency is required");
      }
    } else if (data.type === "selection") {
      if (!data.options || data.options.length === 0) {
        errors.push("At least one selection option is required");
      } else {
        data.options.forEach((opt: any, index: number) => {
          if (!opt.name?.en || opt.name.en.trim() === "") {
            errors.push(`Option ${index + 1} name (English) is required`);
          }
          if (!opt.name?.dutch || opt.name.dutch.trim() === "") {
            errors.push(`Option ${index + 1} name (Dutch) is required`);
          }
        });
      }
    } else if (data.type === "inputFields") {
      if (!data.options || data.options.length === 0) {
        errors.push("At least one input field is required");
      } else {
        data.options.forEach((opt: any, index: number) => {
          if (!opt.name || opt.name.trim() === "") {
            errors.push(`Field ${index + 1} name is required`);
          }
          if (opt.name && opt.name.includes(" ")) {
            errors.push(`Field ${index + 1} name cannot contain spaces`);
          }
          if (!opt.placeHolder?.en || opt.placeHolder.en.trim() === "") {
            errors.push(`Field ${index + 1} placeholder (English) is required`);
          }
          if (!opt.placeHolder?.dutch || opt.placeHolder.dutch.trim() === "") {
            errors.push(`Field ${index + 1} placeholder (Dutch) is required`);
          }
          if (!opt.type) {
            errors.push(`Field ${index + 1} type is required`);
          }
        });
      }
    } else if (data.type === "boolean") {
      if (!data.options || data.options.length === 0) {
        errors.push("Boolean options are required");
      } else {
        // Validate that both Yes and No options have connected questions
        const yesOption = data.options.find((opt: any) => opt.name?.en === "Yes");
        const noOption = data.options.find((opt: any) => opt.name?.en === "No");
        
        if (!yesOption || !yesOption.nextId) {
          errors.push("Yes option must have a connected question");
        }
        if (!noOption || !noOption.nextId) {
          errors.push("No option must have a connected question");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const onFormSubmit = async (data: any) => {
    // Get all form values to ensure we have complete data including paragraphs
    const formValues = watch();
    const completeData = { ...formValues, ...data };
    
    // Custom validation
    const validation = validateForm(completeData);
    
    if (!validation.isValid) {
      // Show all errors in toast
      validation.errors.forEach((error) => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
      // Don't submit - form stays open
      return;
    }

    // Use data as-is from form (same structure as API response)
    onSubmit(completeData);
  };

  // Selection options field array
  const {
    fields: selectionFields,
    append: appendSelection,
    remove: removeSelection,
  } = useFieldArray({
    control,
    name: "options",
  }) as any;

  const addSelectionOption = async () => {
    const newIndex = selectionFields.length;
    appendSelection({
      name: {
        en: "",
        dutch: "",
      },
      selected: false,
    } as any);
    // Trigger validation after adding option with a small delay to ensure field is registered
    setTimeout(async () => {
      await trigger(`options.${newIndex}.name.en` as any);
      await trigger(`options.${newIndex}.name.dutch` as any);
      await trigger("options");
    }, 100);
  };

  // Boolean options (Yes/No) - handled separately
  useEffect(() => {
    if (isBoolean && !isEdit) {
      // If creating a child question (parentId exists), set childId on Yes option
      const yesNextId = parentId && childId ? childId : null;
      setValue("options", [
        {
          name: { en: "No", dutch: "Nee" },
          selected: false,
          nextId: null,
        },
        {
          name: { en: "Yes", dutch: "Ja" },
          selected: false,
          nextId: yesNextId,
        },
      ] as any);
    } else if (isBoolean && isEdit && questionData?.options) {
      setValue("options", questionData.options);
    }
  }, [isBoolean, isEdit, questionData, setValue, parentId, childId]);

  // Get connected question options with type
  const getFriendlyType = (type: string) => {
    switch (type) {
      case "boolean":
        return "Yes/No Question";
      case "selection":
        return "Choice Question";
      case "teethmodel":
        return "Tooth Problem";
      case "diseaseSelection":
        return "Disease Selection";
      case "newComplain":
        return "Complaint";
      case "inputFields":
        return "Input Field";
      case "map":
        return "Location Selection";
      case "result":
        return "Result";
      default:
        return type;
    }
  };

  // Helper function to format question text (truncate to 40 chars, full text in title)
  const formatQuestionLabel = (question: any) => {
    const typeLabel = getFriendlyType(question.type || "");
    const fullText = question.mainText?.en || question.paragraphs?.[0]?.en || question._id;
    const displayText = fullText.length > 40 ? fullText.substring(0, 40) + "..." : fullText;
    return {
      label: `${typeLabel} - ${displayText}`,
      fullLabel: `${typeLabel} - ${fullText}`,
      fullText: fullText,
    };
  };

  const connectedQuestionOptions = allQuestions.map((q) => {
    const formatted = formatQuestionLabel(q);
    return {
      value: q._id,
      label: formatted.label,
      title: formatted.fullLabel,
    };
  });

  // Determine which question types to show
  const availableQuestionTypes = parentId ? RESTRICTED_QUESTION_TYPES : ALL_QUESTION_TYPES;

  // Get parent question for "From" field
  const parentQuestion = parentId ? allQuestions.find((q) => q._id === parentId) : null;
  const parentQuestionFormatted = parentQuestion ? formatQuestionLabel(parentQuestion) : null;
  const parentQuestionLabel = parentQuestionFormatted ? parentQuestionFormatted.label : "";
  const parentQuestionTitle = parentQuestionFormatted ? parentQuestionFormatted.fullLabel : "";

  const currentNextId = watch("action.nextId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Question" : "Create New Question"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <FormProvider {...methods}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Get all form values
                const formValues = watch();
                // Run custom validation
                onFormSubmit(formValues);
              }}
              className="space-y-4"
            >
              {/* From Field - Show parent question when creating a child */}
              {parentId && (
                <div className="space-y-3 border-b pb-4">
                  <h4 className="text-sm font-semibold">From</h4>
                  <div title={parentQuestionTitle}>
                    <Select
                      label="Parent Question"
                      value={parentId || ""}
                      options={[
                        {
                          value: parentId || "",
                          label: parentQuestionLabel,
                          title: parentQuestionTitle,
                        },
                      ]}
                      disabled={true}
                    />
                  </div>
                </div>
              )}

              {/* Question Type Dropdown */}
              <div className="w-48">
                <Select
                  label="Question Type*"
                  value={questionType || ""}
                onChange={(e) => {
                  setValue("type", e.target.value);
                  // Reset fields when type changes
                  if (e.target.value !== "selection" && e.target.value !== "boolean" && e.target.value !== "inputFields") {
                    setValue("options", []);
                  }
                  if (e.target.value !== "newComplain") {
                    setValue("placeholder", { en: "", dutch: "" });
                  }
                  if (e.target.value !== "result") {
                    setValue("paragraphs", []);
                    setValue("points", []);
                    setValue("urgency", "low");
                  }
                  }}
                  options={availableQuestionTypes}
                  disabled={isEdit}
                  error={!!errors.type}
                  errorMessage={(errors.type?.message as string) || ""}
                />
              </div>

              {/* Main Text Fields - Textarea - Hide for result type */}
              {!isResult && (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium leading-none mb-2 block">
                      Question (English)*
                    </label>
                    <Textarea
                      {...register("mainText.en")}
                      rows={3}
                      className={(errors.mainText as any)?.en ? "border-destructive" : ""}
                    />
                    {(errors.mainText as any)?.en && (
                      <p className="text-xs text-destructive mt-1 px-1">
                        {((errors.mainText as any).en?.message as string) || ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none mb-2 block">
                      Question (Dutch)*
                    </label>
                    <Textarea
                      {...register("mainText.dutch")}
                      rows={3}
                      className={(errors.mainText as any)?.dutch ? "border-destructive" : ""}
                    />
                    {(errors.mainText as any)?.dutch && (
                      <p className="text-xs text-destructive mt-1 px-1">
                        {((errors.mainText as any).dutch?.message as string) || ""}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Boolean Options - Show nextId for each option */}
              {isBoolean && (() => {
                const hasChildIdConnection = !!(parentId && childId);
                
                return (
                <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-3">Yes/No Options</h4>
                  {watch("options")?.map((option: any, index: number) => {
                    const isYesOption = option.name?.en === "Yes";
                    const isNoOption = option.name?.en === "No";
                    
                    // Get the full text for the selected question
                    const selectedQuestionId = (option as any).nextId;
                    const selectedQuestion = selectedQuestionId 
                      ? allQuestions.find((q) => q._id === selectedQuestionId)
                      : null;
                    const selectedQuestionTitle = selectedQuestion 
                      ? formatQuestionLabel(selectedQuestion).fullLabel 
                      : "";

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium w-12">
                            {option.name?.en || "Option"}
                          </span>
                          <div title={selectedQuestionTitle} className="flex-1">
                            <Select
                              label={`Connected To (${option.name?.en})`}
                              value={(option as any).nextId || ""}
                              onChange={(e) => {
                              const options = (watch("options") || []) as any[];
                              const newNextId = e.target.value || null;
                              
                              // If creating with parentId and childId, ensure childId stays in one option
                              if (hasChildIdConnection && childId) {
                                const noOptionIndex = options.findIndex((opt: any) => opt.name?.en === "No");
                                const yesOptionIndex = options.findIndex((opt: any) => opt.name?.en === "Yes");
                                
                                if (isYesOption) {
                                  // If Yes is being changed
                                  if (newNextId === childId) {
                                    // Yes gets childId, remove from No
                                    if (noOptionIndex !== -1) {
                                      (options[noOptionIndex] as any).nextId = null;
                                    }
                                    (options[index] as any).nextId = childId;
                                  } else {
                                    // Yes lost childId (if it had it), move to No to ensure childId is preserved
                                    if ((options[index] as any).nextId === childId) {
                                      if (noOptionIndex !== -1) {
                                        (options[noOptionIndex] as any).nextId = childId;
                                      }
                                    }
                                    (options[index] as any).nextId = newNextId;
                                  }
                                } else if (isNoOption) {
                                  // If No is being changed
                                  if (newNextId === childId) {
                                    // No gets childId, remove from Yes
                                    if (yesOptionIndex !== -1) {
                                      (options[yesOptionIndex] as any).nextId = null;
                                    }
                                    (options[index] as any).nextId = childId;
                                  } else {
                                    // No lost childId (if it had it), move to Yes to ensure childId is preserved
                                    if ((options[index] as any).nextId === childId) {
                                      if (yesOptionIndex !== -1) {
                                        (options[yesOptionIndex] as any).nextId = childId;
                                      }
                                    }
                                    (options[index] as any).nextId = newNextId;
                                  }
                                }
                              } else {
                                // Normal behavior when not creating with childId
                                (options[index] as any).nextId = newNextId;
                              }
                              
                              setValue("options", options as any);
                            }}
                            options={[
                              { value: "", label: "None" },
                              ...connectedQuestionOptions,
                            ]}
                            disabled={isEdit}
                          />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isEdit && (
                    <p className="text-xs text-gray-500 mt-2">
                      Connected questions are disabled in edit mode for boolean type.
                    </p>
                  )}
                  {!isEdit && hasChildIdConnection && (
                    <p className="text-xs text-gray-500 mt-2">
                      Child question will connect to the selected option (Yes or No).
                    </p>
                  )}
                </div>
                );
              })()}

              {/* Selection Options */}
              {isSelection && (
                <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Selection Options</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addSelectionOption}
                      className="flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add Option
                    </Button>
                  </div>

                  {selectionFields.map((field: any, index: number) => (
                    <div
                      key={field.id}
                      className="border rounded p-3 space-y-2 bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium">Option {index + 1}</h5>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSelection(index)}
                          className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Name (English)*"
                          {...register(`options.${index}.name.en` as any, {
                            required: "English name is required",
                            validate: (value: any) => {
                              if (!value || (typeof value === "string" && value.trim() === "")) {
                                return "English name is required";
                              }
                              return true;
                            },
                          })}
                          error={!!(errors.options as any)?.[index]?.name?.en}
                          errorMessage={((errors.options as any)?.[index]?.name?.en?.message as string) || "English name is required"}
                        />
                        <Input
                          label="Name (Dutch)*"
                          {...register(`options.${index}.name.dutch` as any, {
                            required: "Dutch name is required",
                            validate: (value: any) => {
                              if (!value || (typeof value === "string" && value.trim() === "")) {
                                return "Dutch name is required";
                              }
                              return true;
                            },
                          })}
                          error={!!(errors.options as any)?.[index]?.name?.dutch}
                          errorMessage={((errors.options as any)?.[index]?.name?.dutch?.message as string) || "Dutch name is required"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Fields Form */}
              {isInputFields && <InputFieldsForm fieldName="options" isEdit={isEdit} />}

              {/* New Complain - Placeholder Fields */}
              {isNewComplain && (
                <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-3">Placeholder</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium leading-none mb-2 block">
                        Placeholder (English)*
                      </label>
                      <Textarea
                        {...register("placeholder.en")}
                        rows={2}
                        className={(errors.placeholder as any)?.en ? "border-destructive" : ""}
                      />
                      {(errors.placeholder as any)?.en && (
                        <p className="text-xs text-destructive mt-1 px-1">
                          {((errors.placeholder as any).en?.message as string) || ""}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium leading-none mb-2 block">
                        Placeholder (Dutch)*
                      </label>
                      <Textarea
                        {...register("placeholder.dutch")}
                        rows={2}
                        className={(errors.placeholder as any)?.dutch ? "border-destructive" : ""}
                      />
                      {(errors.placeholder as any)?.dutch && (
                        <p className="text-xs text-destructive mt-1 px-1">
                          {((errors.placeholder as any).dutch?.message as string) || ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Result Type - Paragraphs and Points */}
              {isResult && (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Paragraphs</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const paragraphs = watch("paragraphs") || [];
                        setValue("paragraphs", [
                          ...paragraphs,
                          { en: "", dutch: "" },
                        ] as any);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add Paragraph
                    </Button>
                  </div>

                  {watch("paragraphs")?.map((paragraph: any, index: number) => (
                    <div key={index} className="border rounded p-3 space-y-2 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium">Paragraph {index + 1}</h5>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const paragraphs = watch("paragraphs") || [];
                            paragraphs.splice(index, 1);
                            setValue("paragraphs", paragraphs);
                          }}
                          className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            English*
                          </label>
                          <Textarea
                            {...register(`paragraphs.${index}.en` as any)}
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            Dutch*
                          </label>
                          <Textarea
                            {...register(`paragraphs.${index}.dutch` as any)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <h4 className="text-sm font-semibold">Points</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const points = watch("points") || [];
                        setValue("points", [...points, { en: "", dutch: "" }] as any);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add Point
                    </Button>
                  </div>

                  {watch("points")?.map((point: any, index: number) => (
                    <div key={index} className="border rounded p-3 space-y-2 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-medium">Point {index + 1}</h5>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const points = watch("points") || [];
                            points.splice(index, 1);
                            setValue("points", points);
                          }}
                          className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            English*
                          </label>
                          <Textarea
                            {...register(`points.${index}.en` as any)}
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">
                            Dutch*
                          </label>
                          <Textarea
                            {...register(`points.${index}.dutch` as any)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div>
                    <Select
                      label="Urgency*"
                      value={watch("urgency") || "low"}
                      onChange={(e) => {
                        setValue("urgency", e.target.value);
                      }}
                      options={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Connected Question Section - Only show if not boolean and not result */}
              {!isBoolean && !isResult && (() => {
                const selectedConnectedId = currentNextId || (parentId && childId ? childId : "");
                const selectedConnectedQuestion = selectedConnectedId 
                  ? allQuestions.find((q) => q._id === selectedConnectedId)
                  : null;
                const selectedConnectedTitle = selectedConnectedQuestion 
                  ? formatQuestionLabel(selectedConnectedQuestion).fullLabel 
                  : "";
                
                return (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="text-sm font-semibold">Connected To</h4>
                    <div title={selectedConnectedTitle}>
                      <Select
                        label="Connected Question"
                        value={selectedConnectedId}
                        onChange={(e) => {
                          setValue("action.nextId", (e.target.value || null) as any);
                        }}
                        options={[
                          { value: "", label: "None" },
                          ...connectedQuestionOptions,
                          // Include childId as an option if it exists and is not already in the list
                          ...(parentId && childId && !connectedQuestionOptions.some((opt) => opt.value === childId)
                            ? [{ value: childId, label: `New Child Question (${childId})`, title: `New Child Question (${childId})` }]
                            : []),
                        ]}
                        disabled={isEdit || !!parentId}
                        error={!!(errors.action as any)?.nextId}
                        errorMessage={((errors.action as any)?.nextId?.message as string) || ""}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Submit Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  className="bg-primary"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Processing...
                    </>
                  ) : isEdit ? (
                    "Update Question"
                  ) : (
                    "Create Question"
                  )}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}

