"use client";

import { Handle, Position } from "@xyflow/react";
import { Edit } from "lucide-react";

const getFriendlyType = (type) => {
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
    default:
      return type;
  }
};

export function QuestionNode({ data, selected }) {
  const person = data?.person || {};
  const connectionCount = data?.connectionCount ?? 0;
  const onEditClick = data?.onEditClick;

  const mainText =
    person.type === "result"
      ? person.paragraphs?.[0]?.en || ""
      : person.mainText?.en || "";
  const displayText =
    mainText.length > 50 ? mainText.slice(0, 50) + "..." : mainText;

  const showEditButton =
    person.type === "boolean" ||
    person.type === "selection" ||
    person.type === "newComplain" ||
    person.type === "result" ||
    person.type === "inputFields";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
      <div
        onClick={() => data?.onNodeClick?.(person._id)}
        title={mainText}
        className={`bg-white rounded-xl shadow-lg p-5 w-56 cursor-pointer border-l-4 relative transition-all min-h-[100px]
          ${selected ? "border-blue-500 scale-105 shadow-2xl" : "border-gray-300"}
          ${person.type === "diseaseSelection" || person.type === "teethmodel" ? "basis-[90%]" : ""}
        `}
      >
        <div className="absolute -top-2 -right-2 flex items-center gap-1">
          {connectionCount > 0 && (
            <div
              className={`rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold
                ${selected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}
              `}
            >
              {connectionCount}
            </div>
          )}
          {showEditButton && onEditClick && (
            <div
              className={`rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition-colors
                ${selected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
              `}
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(person._id);
              }}
            >
              <Edit size={12} />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h5 className="font-bold text-gray-800 text-sm">
            Question Type: {getFriendlyType(person.type)}
          </h5>
          <p className="text-xs text-black" title={mainText}>
            {displayText}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
    </>
  );
}
