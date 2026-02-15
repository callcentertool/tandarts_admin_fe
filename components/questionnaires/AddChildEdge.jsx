"use client";

import {
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
} from "@xyflow/react";
import { Plus } from "lucide-react";

export function AddChildEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const isActive = data?.isActive ?? false;
  const isSelected = data?.isSelected ?? selected;
  const onAddChildClick = data?.onAddChildClick;

  const strokeColor = isSelected ? "#3b82f6" : isActive ? "#60a5fa" : "#d1d5db";
  const strokeWidth = isSelected ? 3 : isActive ? 2 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={MarkerType.ArrowClosed}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isActive ? "0" : "4,2",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onAddChildClick?.(source, target);
            }}
            className={`w-5 h-5 rounded-full bg-white border-2 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110
              ${
                isSelected
                  ? "border-blue-500 hover:bg-blue-50 shadow-blue-200"
                  : isActive
                  ? "border-blue-300 hover:bg-blue-50 shadow-blue-100"
                  : "border-gray-400 hover:bg-gray-50 shadow-gray-200"
              }
            `}
          >
            <Plus
              size={14}
              className={
                isSelected ? "text-blue-600" : isActive ? "text-blue-500" : "text-gray-700"
              }
            />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
