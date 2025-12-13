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

      const chartRect = chartRef.current.getBoundingClientRect();
      const CARD_PADDING = 15; // Minimum distance from cards
      const LINE_SPACING = 10; // Minimum spacing between parallel lines
      const GRID_SIZE = 5; // Grid size for pathfinding (smaller = more precise but slower)

      // ─────────────────────────────────────────────
      // 1. OBSTACLE DETECTION SYSTEM
      // ─────────────────────────────────────────────
      const obstacles = [];
      const cardRects = {};

      // Collect all card positions as obstacles
      filteredData.forEach((item) => {
        const cardElement = document.getElementById(`card-${item._id}`);
        if (cardElement) {
          const rect = cardElement.getBoundingClientRect();
          const cardRect = {
            left: rect.left - chartRect.left - CARD_PADDING,
            right: rect.right - chartRect.left + CARD_PADDING,
            top: rect.top - chartRect.top - CARD_PADDING,
            bottom: rect.bottom - chartRect.top + CARD_PADDING,
            id: item._id,
          };
          obstacles.push(cardRect);
          cardRects[item._id] = cardRect;
        }
      });

      // Helper: Check if a point is inside any obstacle
      const isPointInObstacle = (x, y) => {
        return obstacles.some(
          (obs) => x >= obs.left && x <= obs.right && y >= obs.top && y <= obs.bottom
        );
      };

      // Helper: Check if a line segment intersects any obstacle
      const lineSegmentIntersectsObstacle = (x1, y1, x2, y2) => {
        // Check if any point along the line segment is in an obstacle
        const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / GRID_SIZE;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          if (isPointInObstacle(x, y)) return true;
        }
        return false;
      };

      // ─────────────────────────────────────────────
      // 2. ORTHOGONAL PATHFINDING (A* Algorithm)
      // ─────────────────────────────────────────────
      const findOrthogonalPath = (startX, startY, endX, endY, sourceId, targetId) => {
        // Try simple L-shaped paths first (faster)
        const trySimplePath = (viaX, viaY) => {
          const path1 = [
            { x: startX, y: startY },
            { x: viaX, y: startY },
            { x: viaX, y: viaY },
            { x: endX, y: viaY },
            { x: endX, y: endY },
          ];
          // Check if this path avoids obstacles (excluding source/target cards)
          let valid = true;
          for (let i = 0; i < path1.length - 1; i++) {
            const segStart = path1[i];
            const segEnd = path1[i + 1];
            // Sample points along the segment
            const steps = Math.max(Math.abs(segEnd.x - segStart.x), Math.abs(segEnd.y - segStart.y)) / GRID_SIZE;
            for (let j = 1; j < steps; j++) {
              const t = j / steps;
              const x = segStart.x + (segEnd.x - segStart.x) * t;
              const y = segStart.y + (segEnd.y - segStart.y) * t;
              // Check if point is in an obstacle
              const inObstacle = obstacles.some((obs) => {
                if (obs.id === sourceId || obs.id === targetId) return false; // Allow source/target
                return x >= obs.left && x <= obs.right && y >= obs.top && y <= obs.bottom;
              });
              if (inObstacle) {
                valid = false;
                break;
              }
            }
            if (!valid) break;
          }
          return valid ? path1 : null;
        };

        // Try horizontal-first path
        const hPath = trySimplePath(endX, startY);
        if (hPath) return hPath;

        // Try vertical-first path
        const vPath = trySimplePath(startX, endY);
        if (vPath) return vPath;

        // Try middle paths
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const midPath1 = trySimplePath(midX, startY);
        if (midPath1) return midPath1;
        const midPath2 = trySimplePath(startX, midY);
        if (midPath2) return midPath2;

        // If simple paths don't work, use A* algorithm
        // Round to grid
        const roundToGrid = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;
        const start = { x: roundToGrid(startX), y: roundToGrid(startY) };
        const goal = { x: roundToGrid(endX), y: roundToGrid(endY) };

        // Manhattan distance heuristic
        const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

        // Get neighbors (orthogonal only)
        const getNeighbors = (node) => {
          const neighbors = [];
          const directions = [
            { x: GRID_SIZE, y: 0 },
            { x: -GRID_SIZE, y: 0 },
            { x: 0, y: GRID_SIZE },
            { x: 0, y: -GRID_SIZE },
          ];

          directions.forEach((dir) => {
            const neighbor = { x: node.x + dir.x, y: node.y + dir.y };
            // Skip if in source or target card (but allow connection points)
            const inSourceCard = cardRects[sourceId] &&
              neighbor.x >= cardRects[sourceId].left &&
              neighbor.x <= cardRects[sourceId].right &&
              neighbor.y >= cardRects[sourceId].top &&
              neighbor.y <= cardRects[sourceId].bottom;
            const inTargetCard = cardRects[targetId] &&
              neighbor.x >= cardRects[targetId].left &&
              neighbor.x <= cardRects[targetId].right &&
              neighbor.y >= cardRects[targetId].top &&
              neighbor.y <= cardRects[targetId].bottom;

            if (!inSourceCard && !inTargetCard && !isPointInObstacle(neighbor.x, neighbor.y)) {
              neighbors.push(neighbor);
            }
          });

          return neighbors;
        };

        // A* pathfinding
        const openSet = [{ ...start, g: 0, h: heuristic(start, goal), f: heuristic(start, goal) }];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const nodeKey = (node) => `${node.x},${node.y}`;
        gScore.set(nodeKey(start), 0);
        fScore.set(nodeKey(start), heuristic(start, goal));

        let maxIterations = 5000;
        let iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
          iterations++;

          // Find node with lowest f score
          openSet.sort((a, b) => a.f - b.f);
          const current = openSet.shift();
          const currentKey = nodeKey(current);

          if (closedSet.has(currentKey)) continue;
          closedSet.add(currentKey);

          // Check if we reached the goal (within tolerance)
          if (heuristic(current, goal) < GRID_SIZE * 2) {
            // Reconstruct path
            const path = [goal];
            let node = current;
            while (node) {
              path.unshift(node);
              const key = nodeKey(node);
              node = cameFrom.get(key);
            }
            path[0] = { x: startX, y: startY };
            path[path.length - 1] = { x: endX, y: endY };
            return path;
          }

          // Explore neighbors
          const neighbors = getNeighbors(current);
          neighbors.forEach((neighbor) => {
            const neighborKey = nodeKey(neighbor);
            if (closedSet.has(neighborKey)) return;

            const tentativeG = (gScore.get(currentKey) || Infinity) + GRID_SIZE;

            if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
              cameFrom.set(neighborKey, current);
              gScore.set(neighborKey, tentativeG);
              const h = heuristic(neighbor, goal);
              const f = tentativeG + h;
              fScore.set(neighborKey, f);

              const existing = openSet.find((n) => nodeKey(n) === neighborKey);
              if (!existing) {
                openSet.push({ ...neighbor, g: tentativeG, h, f });
              } else {
                existing.g = tentativeG;
                existing.h = h;
                existing.f = f;
              }
            }
          });
        }

        // Fallback: simple L-shaped path if A* fails
        const fallbackPath = [
          { x: startX, y: startY },
          { x: startX, y: (startY + endY) / 2 },
          { x: endX, y: (startY + endY) / 2 },
          { x: endX, y: endY },
        ];
        return fallbackPath;
      };

      // ─────────────────────────────────────────────
      // 3. COLLECT CONNECTIONS AND CALCULATE PATHS
      // ─────────────────────────────────────────────
      const connections = [];
      Object.entries(mappedConnections).forEach(([sourceId, targets]) => {
        targets.forEach((targetId) => {
          const sourceCard = document.getElementById(`card-${sourceId}`);
          const targetCard = document.getElementById(`card-${targetId}`);

          if (sourceCard && targetCard) {
            const sourceRect = sourceCard.getBoundingClientRect();
            const targetRect = targetCard.getBoundingClientRect();

            const sourceX = sourceRect.left + sourceRect.width / 2 - chartRect.left;
            const sourceY = sourceRect.bottom - chartRect.top - 5;
            const targetX = targetRect.left + targetRect.width / 2 - chartRect.left;
            const targetY = targetRect.top - chartRect.top + 5;

            connections.push({
              id: `${sourceId}-${targetId}`,
              sourceId,
              targetId,
              sourceX,
              sourceY,
              targetX,
              targetY,
              sourceRect: cardRects[sourceId],
              targetRect: cardRects[targetId],
            });
          }
        });
      });

      // ─────────────────────────────────────────────
      // 4. HANDLE MULTIPLE LINES (SPACING)
      // ─────────────────────────────────────────────
      // Group by target and source for offset calculation
      const linesByTarget = {};
      const linesBySource = {};
      connections.forEach((conn) => {
        if (!linesByTarget[conn.targetId]) linesByTarget[conn.targetId] = [];
        if (!linesBySource[conn.sourceId]) linesBySource[conn.sourceId] = [];
        linesByTarget[conn.targetId].push(conn);
        linesBySource[conn.sourceId].push(conn);
      });

      // Apply offsets for multiple connections
      const OFFSET_RANGE = 30;
      Object.values(linesByTarget).forEach((targetLines) => {
        if (targetLines.length > 1) {
          targetLines.sort((a, b) => a.sourceX - b.sourceX);
          const offsetStep = (OFFSET_RANGE * 2) / (targetLines.length + 1);
          targetLines.forEach((line, index) => {
            const offset = -OFFSET_RANGE + offsetStep * (index + 1);
            line.targetOffsetX = offset;
          });
        } else {
          targetLines[0].targetOffsetX = 0;
        }
      });

      Object.values(linesBySource).forEach((sourceLines) => {
        if (sourceLines.length > 1) {
          sourceLines.sort((a, b) => a.targetX - b.targetX);
          const offsetStep = (OFFSET_RANGE * 2) / (sourceLines.length + 1);
          sourceLines.forEach((line, index) => {
            const offset = -OFFSET_RANGE + offsetStep * (index + 1);
            line.sourceOffsetX = offset;
            if (!line.targetOffsetX) line.targetOffsetX = 0;
          });
        } else {
          if (!sourceLines[0].sourceOffsetX) sourceLines[0].sourceOffsetX = 0;
          if (!sourceLines[0].targetOffsetX) sourceLines[0].targetOffsetX = 0;
        }
      });

      // ─────────────────────────────────────────────
      // 5. CALCULATE PATHS FOR EACH CONNECTION
      // ─────────────────────────────────────────────
      const lines = [];
      const icons = [];
      const ICON_RADIUS = 12;
      const MIN_DISTANCE_FROM_CARD = 15;

      connections.forEach((conn) => {
        const sourceX = conn.sourceX + (conn.sourceOffsetX || 0);
        const sourceY = conn.sourceY;
        const targetX = conn.targetX + (conn.targetOffsetX || 0);
        const targetY = conn.targetY;

        // Find orthogonal path
        const path = findOrthogonalPath(
          sourceX,
          sourceY,
          targetX,
          targetY,
          conn.sourceId,
          conn.targetId
        );

        // Simplify path (remove redundant points)
        const simplifiedPath = [];
        if (path.length > 0) {
          simplifiedPath.push(path[0]);
          for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];
            // Keep point if it's a corner (direction changes)
            const dir1 = { x: curr.x - prev.x, y: curr.y - prev.y };
            const dir2 = { x: next.x - curr.x, y: next.y - curr.y };
            if (dir1.x !== dir2.x || dir1.y !== dir2.y) {
              simplifiedPath.push(curr);
            }
          }
          simplifiedPath.push(path[path.length - 1]);
        }

        lines.push({
          id: conn.id,
          sourceId: conn.sourceId,
          targetId: conn.targetId,
          path: simplifiedPath,
          sourceX,
          sourceY,
          targetX,
          targetY,
        });

        // Calculate plus icon position (middle of path, avoiding cards)
        if (simplifiedPath.length >= 2) {
          const midIndex = Math.floor(simplifiedPath.length / 2);
          let iconX = simplifiedPath[midIndex].x;
          let iconY = simplifiedPath[midIndex].y;

          // Adjust if too close to a card
          const isTooClose = (x, y) => {
            return obstacles.some((obs) => {
              const distX = Math.max(obs.left - x, x - obs.right, 0);
              const distY = Math.max(obs.top - y, y - obs.bottom, 0);
              const dist = Math.sqrt(distX * distX + distY * distY);
              return dist < MIN_DISTANCE_FROM_CARD + ICON_RADIUS;
            });
          };

          // Try to find a safe position near the midpoint
          if (isTooClose(iconX, iconY)) {
            // Try positions along the path
            for (let i = 0; i < simplifiedPath.length; i++) {
              const testX = simplifiedPath[i].x;
              const testY = simplifiedPath[i].y;
              if (!isTooClose(testX, testY)) {
                iconX = testX;
                iconY = testY;
                break;
              }
            }
          }

          icons.push({
            id: conn.id,
            x: iconX,
            y: iconY,
            sourceId: conn.sourceId,
            targetId: conn.targetId,
          });
        }
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

          // Build orthogonal path from path points
          let pathData = "";
          if (line.path && line.path.length > 0) {
            pathData = `M ${line.path[0].x} ${line.path[0].y}`;
            for (let i = 1; i < line.path.length; i++) {
              pathData += ` L ${line.path[i].x} ${line.path[i].y}`;
            }
          } else {
            // Fallback to straight line if no path
            pathData = `M ${line.sourceX} ${line.sourceY} L ${line.targetX} ${line.targetY}`;
          }

          // Calculate arrow orientation from last segment of path
          let endAngle = 0;
          if (line.path && line.path.length >= 2) {
            const lastPoint = line.path[line.path.length - 1];
            const secondLastPoint = line.path[line.path.length - 2];
            endAngle = Math.atan2(
              lastPoint.y - secondLastPoint.y,
              lastPoint.x - secondLastPoint.x
            );
          } else {
            endAngle = Math.atan2(
              line.targetY - line.sourceY,
              line.targetX - line.sourceX
            );
          }

          // Arrow head points (rotated based on path angle)
          const arrowSize = 8;
          const arrowWidth = 6;
          const arrowX1 = line.targetX - arrowSize * Math.cos(endAngle) + arrowWidth * Math.sin(endAngle);
          const arrowY1 = line.targetY - arrowSize * Math.sin(endAngle) - arrowWidth * Math.cos(endAngle);
          const arrowX2 = line.targetX - arrowSize * Math.cos(endAngle) - arrowWidth * Math.sin(endAngle);
          const arrowY2 = line.targetY - arrowSize * Math.sin(endAngle) + arrowWidth * Math.cos(endAngle);

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
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <polygon
                points={`${line.targetX},${line.targetY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
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
