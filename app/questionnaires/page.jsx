"use client";
import { MainLayout } from "@/components/layout/main-layout";
import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit } from "lucide-react";
import { getQuestions, updateQuestion, createQuestion } from "@/services/questions.service";
import {
  setLoading,
  setQuestionnaires,
} from "@/store/slices/questionnairesSlice";
import { useDispatch, useSelector } from "react-redux";
import { QuestionModal } from "@/components/modals/question-modal";

const QuestionnairesPage = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector(
    (state) => state.questionnaires
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [childId, setChildId] = useState(null);

  // Fetch questions
  const fetchQuestions = async () => {
    dispatch(setLoading(true));
    try {
      const data = await getQuestions();
      dispatch(
        setQuestionnaires({
          items: data?.data || [],
        })
      );
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle edit click
  const handleEditClick = (questionId) => {
    setSelectedQuestionId(questionId);
    setParentId(null);
    setChildId(null);
    setIsModalOpen(true);
  };

  // Handle add child question click (from plus icon)
  const handleAddChildClick = (parentId, childId) => {
    setSelectedQuestionId(null);
    setParentId(parentId);
    setChildId(childId);
    setIsModalOpen(true);
  };

  // Handle modal submission
  const handleModalSubmit = async (data) => {
    try {
      if (selectedQuestionId) {
        // Update existing question
        await updateQuestion(selectedQuestionId, data);
      } else {
        // Create new question
        const payload = { ...data };
        // Include parentId if creating a child question
        if (parentId) {
          payload.parentId = parentId;
        }
        await createQuestion(payload);
      }
      // Refresh questions list
      await fetchQuestions();
      setIsModalOpen(false);
      setSelectedQuestionId(null);
      setParentId(null);
      setChildId(null);
    } catch (err) {
      console.error("Error saving question:", err);
    }
  };

  // Handle modal close
  const handleModalClose = (open) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedQuestionId(null);
      setParentId(null);
      setChildId(null);
    }
  };

  return (
    <MainLayout>
      <div className="sm:space-y-6">
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                Loading questions...
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-red-500">
                Error loading questions.
              </div>
            ) : items.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-400">
                No questions found.
              </div>
            ) : (
              <HierarchyChart 
                data={items} 
                onEditClick={handleEditClick}
                onAddChildClick={handleAddChildClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Question Modal */}
      <QuestionModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        questionId={selectedQuestionId}
        parentId={parentId}
        childId={childId}
        allQuestions={items}
        onSubmit={handleModalSubmit}
      />
    </MainLayout>
  );
};

export default QuestionnairesPage;

// ─────────────────────────────────────────────
// HIERARCHY CHART COMPONENT
// ─────────────────────────────────────────────

const HierarchyChart = ({ data, onEditClick, onAddChildClick }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeConnections, setActiveConnections] = useState([]);
  const [connectionLines, setConnectionLines] = useState([]);
  const [plusIcons, setPlusIcons] = useState([]);
  const chartRef = useRef(null);

  // Filter starting from specific _id
  const filteredData = React.useMemo(() => {
    const startId = "6836c2f013efd520c8e3e26b";
    const startIndex = data.findIndex((item) => item._id === startId);
    if (startIndex === -1) return [];
    return data.slice(startIndex);
  }, [data]);

  // Map children using _id
  const mappedConnections = React.useMemo(() => {
    const obj = {};
    filteredData.forEach((p) => {
      obj[p._id] = (p.children || []).filter(Boolean);
    });
    return obj;
  }, [filteredData]);

  const handleCardClick = (cardId) => {
    setSelectedCard(cardId);
    setActiveConnections(mappedConnections[cardId] || []);
  };

  useEffect(() => {
    const calculateLines = () => {
      if (!chartRef.current) return;

      const lines = [];
      const chartRect = chartRef.current.getBoundingClientRect();
      const OFFSET_RANGE = 40; // Maximum horizontal offset in pixels
      const MIN_OFFSET = 8; // Minimum offset to prevent visual overlap

      // First pass: collect all lines with basic positions
      Object.entries(mappedConnections).forEach(([sourceId, targets]) => {
        targets.forEach((targetId) => {
          const sourceCard = document.getElementById(`card-${sourceId}`);
          const targetCard = document.getElementById(`card-${targetId}`);

          if (sourceCard && targetCard) {
            const sourceRect = sourceCard.getBoundingClientRect();
            const targetRect = targetCard.getBoundingClientRect();

            lines.push({
              id: `${sourceId}-${targetId}`,
              sourceX: sourceRect.left + sourceRect.width / 2 - chartRect.left,
              sourceY: sourceRect.bottom - chartRect.top - 5,
              targetX: targetRect.left + targetRect.width / 2 - chartRect.left,
              targetY: targetRect.top - chartRect.top + 5,
              sourceId: sourceId,
              targetId: targetId,
              // Store card bounds for icon positioning
              sourceRect: {
                left: sourceRect.left - chartRect.left,
                right: sourceRect.right - chartRect.left,
                top: sourceRect.top - chartRect.top,
                bottom: sourceRect.bottom - chartRect.top,
              },
              targetRect: {
                left: targetRect.left - chartRect.left,
                right: targetRect.right - chartRect.left,
                top: targetRect.top - chartRect.top,
                bottom: targetRect.bottom - chartRect.top,
              },
            });
          }
        });
      });

      // Group lines by target ID (multiple parents pointing to same child)
      const linesByTarget = {};
      lines.forEach((line) => {
        if (!linesByTarget[line.targetId]) {
          linesByTarget[line.targetId] = [];
        }
        linesByTarget[line.targetId].push(line);
      });

      // Group lines by source ID (one parent with multiple children)
      const linesBySource = {};
      lines.forEach((line) => {
        if (!linesBySource[line.sourceId]) {
          linesBySource[line.sourceId] = [];
        }
        linesBySource[line.sourceId].push(line);
      });

      // Calculate offsets for lines sharing the same target
      Object.values(linesByTarget).forEach((targetLines) => {
        if (targetLines.length > 1) {
          // Sort by source X position for consistent ordering
          targetLines.sort((a, b) => a.sourceX - b.sourceX);
          
          // Calculate offsets: distribute evenly across offset range
          const offsetStep = (OFFSET_RANGE * 2) / (targetLines.length + 1);
          targetLines.forEach((line, index) => {
            const offsetIndex = index + 1;
            const offset = -OFFSET_RANGE + offsetStep * offsetIndex;
            // Ensure minimum offset for visual separation
            line.targetOffsetX = Math.abs(offset) < MIN_OFFSET 
              ? (offset >= 0 ? MIN_OFFSET : -MIN_OFFSET) 
              : offset;
          });
        } else {
          targetLines[0].targetOffsetX = 0;
        }
      });

      // Calculate offsets for lines sharing the same source
      Object.values(linesBySource).forEach((sourceLines) => {
        if (sourceLines.length > 1) {
          // Sort by target X position for consistent ordering
          sourceLines.sort((a, b) => a.targetX - b.targetX);
          
          // Calculate offsets: distribute evenly across offset range
          const offsetStep = (OFFSET_RANGE * 2) / (sourceLines.length + 1);
          sourceLines.forEach((line, index) => {
            const offsetIndex = index + 1;
            const sourceOffset = -OFFSET_RANGE + offsetStep * offsetIndex;
            // Ensure minimum offset for visual separation
            const finalSourceOffset = Math.abs(sourceOffset) < MIN_OFFSET 
              ? (sourceOffset >= 0 ? MIN_OFFSET : -MIN_OFFSET) 
              : sourceOffset;
            
            // Combine with target offset if it exists
            line.sourceOffsetX = finalSourceOffset;
            if (!line.targetOffsetX) {
              line.targetOffsetX = 0;
            }
          });
        } else {
          if (!sourceLines[0].sourceOffsetX) {
            sourceLines[0].sourceOffsetX = 0;
          }
          if (!sourceLines[0].targetOffsetX) {
            sourceLines[0].targetOffsetX = 0;
          }
        }
      });

      // Handle very close parent/child positions
      lines.forEach((line) => {
        const horizontalDistance = Math.abs(line.targetX - line.sourceX);
        if (horizontalDistance < MIN_OFFSET * 2) {
          // If cards are very close, ensure minimum offset to prevent overlap
          if (Math.abs(line.sourceOffsetX) < MIN_OFFSET && Math.abs(line.targetOffsetX) < MIN_OFFSET) {
            line.sourceOffsetX = line.sourceOffsetX >= 0 ? MIN_OFFSET : -MIN_OFFSET;
            line.targetOffsetX = line.targetOffsetX >= 0 ? MIN_OFFSET : -MIN_OFFSET;
          }
        }
      });

      // Ensure all lines have offset values and calculate plus icon positions
      const icons = [];
      const ICON_RADIUS = 12; // Half size of plus icon (for overlap detection)
      const MIN_DISTANCE_FROM_CARD = 15; // Minimum distance from card edge

      lines.forEach((line) => {
        if (line.sourceOffsetX === undefined) line.sourceOffsetX = 0;
        if (line.targetOffsetX === undefined) line.targetOffsetX = 0;

        // Calculate actual connection points with offsets
        const sourceX = line.sourceX + (line.sourceOffsetX || 0);
        const sourceY = line.sourceY;
        const targetX = line.targetX + (line.targetOffsetX || 0);
        const targetY = line.targetY;

        // Calculate control point for quadratic Bezier curve
        const controlY = sourceY + (targetY - sourceY) / 2;
        const controlX = (sourceX + targetX) / 2;

        // Helper function to check if a point is inside a card
        const isInsideCard = (x, y, cardRect) => {
          return x >= cardRect.left && 
                 x <= cardRect.right && 
                 y >= cardRect.top && 
                 y <= cardRect.bottom;
        };

        // Helper function to check if a point is too close to a card
        const isTooCloseToCard = (x, y, cardRect) => {
          const iconLeft = x - ICON_RADIUS;
          const iconRight = x + ICON_RADIUS;
          const iconTop = y - ICON_RADIUS;
          const iconBottom = y + ICON_RADIUS;

          return !(iconRight < cardRect.left - MIN_DISTANCE_FROM_CARD ||
                   iconLeft > cardRect.right + MIN_DISTANCE_FROM_CARD ||
                   iconBottom < cardRect.top - MIN_DISTANCE_FROM_CARD ||
                   iconTop > cardRect.bottom + MIN_DISTANCE_FROM_CARD);
        };

        // Find a safe position along the curve that is OUTSIDE both cards
        // Priority: 1) Between cards, 2) Above source card, 3) Below target card
        let bestT = 0.5;
        let bestX = 0;
        let bestY = 0;
        let foundSafePosition = false;

        // First, try positions between cards (t = 0.2 to 0.8)
        for (let t = 0.2; t <= 0.8 && !foundSafePosition; t += 0.05) {
          const testX = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * controlX + t * t * targetX;
          const testY = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * controlY + t * t * targetY;

          const insideSource = isInsideCard(testX, testY, line.sourceRect);
          const insideTarget = isInsideCard(testX, testY, line.targetRect);
          const tooCloseSource = isTooCloseToCard(testX, testY, line.sourceRect);
          const tooCloseTarget = isTooCloseToCard(testX, testY, line.targetRect);

          // Position is safe if it's not inside or too close to either card
          if (!insideSource && !insideTarget && !tooCloseSource && !tooCloseTarget) {
            bestT = t;
            bestX = testX;
            bestY = testY;
            foundSafePosition = true;
          }
        }

        // If no position found between cards, try above source card (t < 0.2)
        if (!foundSafePosition) {
          for (let t = 0.05; t < 0.2 && !foundSafePosition; t += 0.05) {
            const testX = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * controlX + t * t * targetX;
            const testY = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * controlY + t * t * targetY;

            const insideSource = isInsideCard(testX, testY, line.sourceRect);
            const tooCloseSource = isTooCloseToCard(testX, testY, line.sourceRect);

            if (!insideSource && !tooCloseSource) {
              bestT = t;
              bestX = testX;
              bestY = testY;
              foundSafePosition = true;
            }
          }
        }

        // If still no position found, try below target card (t > 0.8)
        if (!foundSafePosition) {
          for (let t = 0.85; t <= 0.95 && !foundSafePosition; t += 0.05) {
            const testX = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * controlX + t * t * targetX;
            const testY = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * controlY + t * t * targetY;

            const insideTarget = isInsideCard(testX, testY, line.targetRect);
            const tooCloseTarget = isTooCloseToCard(testX, testY, line.targetRect);

            if (!insideTarget && !tooCloseTarget) {
              bestT = t;
              bestX = testX;
              bestY = testY;
              foundSafePosition = true;
            }
          }
        }

        // Fallback: if still no safe position, place it in the middle of the gap
        // This should rarely happen, but ensures we always have a position
        if (!foundSafePosition) {
          // Place icon at midpoint but offset vertically to avoid cards
          const midY = (sourceY + targetY) / 2;
          const midX = (sourceX + targetX) / 2;
          
          // Check which card is closer and offset away from it
          const distToSource = Math.abs(midY - line.sourceRect.bottom);
          const distToTarget = Math.abs(midY - line.targetRect.top);
          
          if (distToSource < distToTarget) {
            // Place above source card
            bestY = line.sourceRect.top - MIN_DISTANCE_FROM_CARD - ICON_RADIUS;
          } else {
            // Place below target card
            bestY = line.targetRect.bottom + MIN_DISTANCE_FROM_CARD + ICON_RADIUS;
          }
          bestX = midX;
        }

        icons.push({
          id: line.id,
          x: bestX,
          y: bestY,
          sourceId: line.sourceId,
          targetId: line.targetId,
        });
      });

      setConnectionLines(lines);
      setPlusIcons(icons);
    };

    const timeout = setTimeout(calculateLines, 100);
    window.addEventListener("resize", calculateLines);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", calculateLines);
    };
  }, [mappedConnections, filteredData]);

  const organizeRows = () => {
    const rows = [];
    const processed = new Set();

    const topLevel = filteredData.filter(
      (person) => !Object.values(mappedConnections).flat().includes(person._id)
    );

    rows.push(topLevel);
    topLevel.forEach((p) => processed.add(p._id));

    let currentRow = topLevel;

    while (currentRow.length) {
      const nextRow = [];

      currentRow.forEach((p) => {
        (mappedConnections[p._id] || []).forEach((cid) => {
          if (!processed.has(cid)) {
            const found = filteredData.find((d) => d._id === cid);
            if (found && !nextRow.some((n) => n._id === cid)) {
              nextRow.push(found);
              processed.add(cid);
            }
          }
        });
      });

      if (nextRow.length) rows.push(nextRow);
      currentRow = nextRow;
    }

    return rows;
  };

  const rows = organizeRows();

  return (
    <div
      ref={chartRef}
      className="hierarchy-chart p-4 overflow-auto relative min-h-[500px]"
    >
      {/* Connection Lines + Mid Plus Icon */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {connectionLines.map((line) => {
          const isActive =
            selectedCard === line.sourceId ||
            activeConnections.includes(line.targetId);

          const isSelected =
            selectedCard === line.sourceId &&
            activeConnections.includes(line.targetId);

          // Calculate actual connection points with offsets
          const sourceX = line.sourceX + (line.sourceOffsetX || 0);
          const sourceY = line.sourceY;
          const targetX = line.targetX + (line.targetOffsetX || 0);
          const targetY = line.targetY;

          // Calculate control point for quadratic Bezier curve
          // Control point is positioned vertically between source and target,
          // horizontally at the offset position for smooth curve
          const controlY = sourceY + (targetY - sourceY) / 2;
          const controlX = (sourceX + targetX) / 2;

          // Create quadratic Bezier path
          const pathData = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;

          // Calculate angle at the end of the curve for arrow orientation
          // For quadratic Bezier: derivative at t=1 gives the tangent
          const endAngle = Math.atan2(
            targetY - controlY,
            targetX - controlX
          );

          // Arrow head points (rotated based on curve angle)
          const arrowSize = 8;
          const arrowWidth = 6;
          const arrowX1 = targetX - arrowSize * Math.cos(endAngle) + arrowWidth * Math.sin(endAngle);
          const arrowY1 = targetY - arrowSize * Math.sin(endAngle) - arrowWidth * Math.cos(endAngle);
          const arrowX2 = targetX - arrowSize * Math.cos(endAngle) - arrowWidth * Math.sin(endAngle);
          const arrowY2 = targetY - arrowSize * Math.sin(endAngle) + arrowWidth * Math.cos(endAngle);

          return (
            <g key={line.id}>
              <path
                d={pathData}
                fill="none"
                stroke={
                  isSelected ? "#3b82f6" : isActive ? "#60a5fa" : "#d1d5db"
                }
                strokeWidth={isSelected ? 3 : isActive ? 2 : 1.5}
                strokeDasharray={isActive ? "0" : "4,2"}
              />

              <polygon
                points={`${targetX},${targetY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
                fill={isSelected ? "#3b82f6" : isActive ? "#60a5fa" : "#d1d5db"}
              />
            </g>
          );
        })}
      </svg>
      {/* Cards */}
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex flex-wrap justify-center gap-6 mb-24 relative z-10 ${
            i > 0 ? "mt-24" : ""
          }`}
        >
          {row.map((person) => (
            <Card
              key={person._id}
              person={person}
              isSelected={selectedCard === person._id}
              connectionCount={(person.children || []).filter(Boolean).length}
              onClick={() => handleCardClick(person._id)}
              onEditClick={onEditClick}
            />
          ))}
        </div>
      ))}
      {/* Plus Icons - rendered above cards */}
      {plusIcons.length > 0 && (
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 20 }}
        >
          {plusIcons.map((icon) => {
            const isActive =
              selectedCard === icon.sourceId ||
              activeConnections.includes(icon.targetId);

            const isSelected =
              selectedCard === icon.sourceId &&
              activeConnections.includes(icon.targetId);

            return (
              <div
                key={icon.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${icon.x}px`,
                  top: `${icon.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 21,
                }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChildClick(icon.sourceId, icon.targetId);
                  }}
                  className={`w-5 h-5 rounded-full bg-white border-2 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                    isSelected
                      ? "border-blue-500 hover:bg-blue-50 shadow-blue-200"
                      : isActive
                      ? "border-blue-300 hover:bg-blue-50 shadow-blue-100"
                      : "border-gray-400 hover:bg-gray-50 shadow-gray-200"
                  }`}
                  style={{ zIndex: 22 }}
                >
                  <Plus
                    size={14}
                    className={
                      isSelected
                        ? "text-blue-600"
                        : isActive
                        ? "text-blue-500"
                        : "text-gray-700"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────

const Card = ({ person, isSelected, connectionCount, onClick, onEditClick }) => {
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
  const mainText =
    person.type === "result"
      ? person.paragraphs?.[0]?.en || ""
      : person.mainText?.en || "";

  const displayText =
    mainText.length > 50 ? mainText.slice(0, 50) + "..." : mainText;

  return (
    <div
      id={`card-${person._id}`}
      onClick={onClick}
      title={mainText}
      className={`bg-white rounded-xl shadow-lg p-5 w-56 cursor-pointer border-l-4 relative transition-all 
        ${
          isSelected
            ? "border-blue-500 scale-105 shadow-2xl"
            : "border-gray-300"
        }
        ${
          person.type == "diseaseSelection" || person.type == "teethmodel"
            ? "basis-[90%]"
            : "basis-1/3"
        }
      `}
    >
      <div className="absolute -top-2 -right-2 flex items-center gap-1">
        {connectionCount > 0 && (
          <div
            className={`rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold
              ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }
            `}
          >
            {connectionCount}
          </div>
        )}
        {(person.type === "boolean" ||
          person.type === "selection" ||
          person.type === "newComplain" ||
          person.type === "result" ||
          person.type === "inputFields") && (
          <div
            className={`rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition-colors
              ${
                isSelected
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
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
        <p className="text-xs text-black" title={mainText}>{displayText}</p>
      </div>
    </div>
  );
};
