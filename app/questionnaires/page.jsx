"use client";
import { MainLayout } from "@/components/layout/main-layout";
import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { getQuestions } from "@/services/questions.service";
import {
  setLoading,
  setQuestionnaires,
} from "@/store/slices/questionnairesSlice";
import { useDispatch, useSelector } from "react-redux";

const QuestionnairesPage = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector(
    (state) => state.questionnaires
  );

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

  return (
    <MainLayout>
      {" "}
      <div className="sm:space-y-6">
        {" "}
        <div className="min-h-screen">
          {" "}
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                Loading questions...{" "}
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-red-500">
                Error loading questions.{" "}
              </div>
            ) : items.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-400">
                No questions found.{" "}
              </div>
            ) : (
              <HierarchyChart data={items} />
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </MainLayout>
  );
};

export default QuestionnairesPage;

// ─────────────────────────────────────────────
// HIERARCHY CHART COMPONENT
// ─────────────────────────────────────────────

const HierarchyChart = ({ data }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeConnections, setActiveConnections] = useState([]);
  const [connectionLines, setConnectionLines] = useState([]);
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
            });
          }
        });
      });

      setConnectionLines(lines);
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
      {/* Connection Lines + Mid Plus Icon */}{" "}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {connectionLines.map((line) => {
          const isActive =
            selectedCard === line.sourceId ||
            activeConnections.includes(line.targetId);

          const isSelected =
            selectedCard === line.sourceId &&
            activeConnections.includes(line.targetId);

          const midX = (line.sourceX + line.targetX) / 2;
          const midY = (line.sourceY + line.targetY) / 2;

          return (
            <g key={line.id}>
              <line
                x1={line.sourceX}
                y1={line.sourceY}
                x2={line.targetX}
                y2={line.targetY}
                stroke={
                  isSelected ? "#3b82f6" : isActive ? "#60a5fa" : "#d1d5db"
                }
                strokeWidth={isSelected ? 3 : isActive ? 2 : 1.5}
                strokeDasharray={isActive ? "0" : "4,2"}
              />

              <polygon
                points={`${line.targetX},${line.targetY}
                    ${line.targetX - 6},${line.targetY - 8}
                    ${line.targetX + 6},${line.targetY - 8}`}
                fill={isSelected ? "#3b82f6" : isActive ? "#60a5fa" : "#d1d5db"}
              />

              {/* Plus Icon */}
              <foreignObject
                x={midX - 10}
                y={midY - 10}
                width="24"
                height="24"
                className="pointer-events-auto"
              >
                <div
                  onClick={() =>
                    alert(`Parent: ${line.sourceId} → Child: ${line.targetId}`)
                  }
                  className="w-5 h-5 rounded-full bg-white border border-gray-400 shadow flex items-center justify-center cursor-pointer hover:bg-blue-50"
                >
                  <Plus size={14} className="text-gray-700" />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      {/* Cards */}
      {rows.map((row, i) => (
        <div
          key={i}
          className={`flex flex-wrap justify-center gap-6 mb-24 z-10 ${
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
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────

const Card = ({ person, isSelected, connectionCount, onClick }) => {
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
      {connectionCount > 0 && (
        <div
          className={`absolute -top-2 -right-2 rounded-full w-5  flex items-center justify-center text-xs font-bold
            ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }
          `}
        >
          {connectionCount}{" "}
        </div>
      )}

      <div className="flex flex-col">
        <h5 className="font-bold text-gray-800 text-sm">
          Question Type: {getFriendlyType(person.type)}
        </h5>
        <p className="text-xs text-black">{displayText}</p>
      </div>
    </div>
  );
};
