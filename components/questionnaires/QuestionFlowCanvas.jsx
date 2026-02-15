"use client";

import "@xyflow/react/dist/style.css";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
} from "@xyflow/react";
import dagre from "dagre";
import { QuestionNode } from "./QuestionNode";
import { AddChildEdge } from "./AddChildEdge";

const NODE_WIDTH = 224;
const NODE_HEIGHT = 120;

const nodeTypes = { question: QuestionNode };
const edgeTypes = { addChild: AddChildEdge };

function getLayoutedElements(nodes, edges, direction = "TB") {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 150,
  });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

export function QuestionFlowCanvas({ data, onEditClick, onAddChildClick }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Filter starting from specific _id (or use first root if not found)
  const filteredData = useMemo(() => {
    const startId = "6836c2f013efd520c8e3e26b";
    const startIndex = data.findIndex((item) => item._id === startId);
    if (startIndex === -1) {
      // Fallback: use first root (no parent)
      const mappedConnections = {};
      data.forEach((p) => {
        mappedConnections[p._id] = (p.children || []).filter(Boolean);
      });
      const allChildren = new Set(Object.values(mappedConnections).flat());
      const roots = data.filter((p) => !allChildren.has(p._id));
      if (roots.length === 0) return data;
      const firstRootIndex = data.findIndex((p) => p._id === roots[0]._id);
      return data.slice(firstRootIndex);
    }
    return data.slice(startIndex);
  }, [data]);

  const mappedConnections = useMemo(() => {
    const obj = {};
    filteredData.forEach((p) => {
      obj[p._id] = (p.children || []).filter(Boolean);
    });
    return obj;
  }, [filteredData]);

  const handleNodeClick = useCallback(
    (nodeId) => {
      setSelectedNodeId(nodeId);
    },
    []
  );

  const activeConnections = useMemo(
    () => (selectedNodeId ? mappedConnections[selectedNodeId] || [] : []),
    [selectedNodeId, mappedConnections]
  );

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = filteredData.map((item) => ({
      id: item._id,
      type: "question",
      position: { x: 0, y: 0 },
      data: {
        person: item,
        connectionCount: (item.children || []).filter(Boolean).length,
        onEditClick,
        onNodeClick: handleNodeClick,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    const edges = [];
    Object.entries(mappedConnections).forEach(([sourceId, targets]) => {
      targets.forEach((targetId) => {
        edges.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: "addChild",
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { onAddChildClick },
        });
      });
    });

    const layouted = getLayoutedElements(nodes, edges);
    return { initialNodes: layouted, initialEdges: edges };
  }, [filteredData, mappedConnections, onEditClick, onAddChildClick, handleNodeClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync layout when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Update edge data when selection changes
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          isActive:
            selectedNodeId === edge.source ||
            activeConnections.includes(edge.target),
          isSelected:
            selectedNodeId === edge.source &&
            activeConnections.includes(edge.target),
          onAddChildClick,
        },
      }))
    );
  }, [selectedNodeId, activeConnections, onAddChildClick, setEdges]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  if (filteredData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        No questions to display.
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-12rem)] min-h-[500px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
