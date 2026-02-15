"use client";
import { MainLayout } from "@/components/layout/main-layout";
import React, { useState, useEffect } from "react";
import { getQuestions, updateQuestion, createQuestion } from "@/services/questions.service";
import {
  setLoading,
  setQuestionnaires,
} from "@/store/slices/questionnairesSlice";
import { useDispatch, useSelector } from "react-redux";
import { QuestionModal } from "@/components/modals/question-modal";
import { QuestionFlowCanvas } from "@/components/questionnaires/QuestionFlowCanvas";

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
              <QuestionFlowCanvas
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
