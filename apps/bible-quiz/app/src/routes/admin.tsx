import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

interface QuestionForm {
  questionText: string;
  options: { optionText: string; isCorrect: boolean }[];
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || user?.role !== "admin") {
    navigate({ to: "/" });
    return null;
  }

  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizDescription, setNewQuizDescription] = useState("");
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);
  const [addingQuestionToQuiz, setAddingQuestionToQuiz] = useState<
    number | null
  >(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    questionText: "",
    options: [
      { optionText: "", isCorrect: true },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ],
  });

  // Fetch all quizzes (admin)
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["adminQuizzes"],
    queryFn: () => api.quiz.admin.list(),
  });

  // Fetch quiz details
  const { data: quizDetails } = useQuery({
    queryKey: ["adminQuizDetail", expandedQuiz],
    queryFn: () => api.quiz.admin.get({ quizId: expandedQuiz! }),
    enabled: !!expandedQuiz,
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      api.quiz.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
      setShowCreateQuiz(false);
      setNewQuizTitle("");
      setNewQuizDescription("");
    },
  });

  // Toggle quiz active mutation
  const toggleQuizMutation = useMutation({
    mutationFn: (data: { quizId: number; isActive: boolean }) =>
      api.quiz.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: number) => api.quiz.delete({ quizId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
      setExpandedQuiz(null);
    },
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: (data: {
      quizId: number;
      questionText: string;
      options: { optionText: string; isCorrect: boolean }[];
    }) => api.quiz.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminQuizDetail", expandedQuiz],
      });
      queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
      setAddingQuestionToQuiz(null);
      resetQuestionForm();
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => api.quiz.deleteQuestion({ questionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminQuizDetail", expandedQuiz],
      });
      queryClient.invalidateQueries({ queryKey: ["adminQuizzes"] });
    },
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: "",
      options: [
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ],
    });
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;
    createQuizMutation.mutate({
      title: newQuizTitle.trim(),
      description: newQuizDescription.trim() || undefined,
    });
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingQuestionToQuiz || !questionForm.questionText.trim()) return;

    const filledOptions = questionForm.options.filter((o) =>
      o.optionText.trim(),
    );
    if (filledOptions.length < 2) return;

    createQuestionMutation.mutate({
      quizId: addingQuestionToQuiz,
      questionText: questionForm.questionText.trim(),
      options: filledOptions.map((o) => ({
        optionText: o.optionText.trim(),
        isCorrect: o.isCorrect,
      })),
    });
  };

  const setCorrectOption = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      })),
    }));
  };

  const updateOptionText = (index: number, text: string) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, optionText: text } : opt,
      ),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quiz Management
            </h1>
            <p className="text-gray-500">Create and manage quizzes</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateQuiz(!showCreateQuiz)}>
          <Plus className="h-4 w-4 mr-2" />
          New Quiz
        </Button>
      </div>

      {/* Create Quiz Form */}
      {showCreateQuiz && (
        <Card className="mb-6">
          <form onSubmit={handleCreateQuiz}>
            <CardHeader>
              <CardTitle>Create New Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Quiz Title"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                placeholder="Enter quiz title..."
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  value={newQuizDescription}
                  onChange={(e) => setNewQuizDescription(e.target.value)}
                  placeholder="Enter quiz description..."
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit" disabled={createQuizMutation.isPending}>
                {createQuizMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Quiz
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateQuiz(false)}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Quiz List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        quiz.isActive ? "bg-green-500" : "bg-gray-300",
                      )}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {quiz.questionCount} questions · Created by{" "}
                        {quiz.createdByUser?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQuizMutation.mutate({
                          quizId: quiz.id,
                          isActive: !quiz.isActive,
                        });
                      }}
                    >
                      {quiz.isActive ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1 text-yellow-600" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this quiz?")) {
                          deleteQuizMutation.mutate(quiz.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                    {expandedQuiz === quiz.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Quiz Details */}
              {expandedQuiz === quiz.id && quizDetails && (
                <div className="border-t bg-gray-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Questions</h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddingQuestionToQuiz(quiz.id);
                        resetQuestionForm();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  {/* Add Question Form */}
                  {addingQuestionToQuiz === quiz.id && (
                    <Card className="mb-4 bg-white">
                      <form onSubmit={handleAddQuestion}>
                        <CardContent className="pt-6 space-y-4">
                          <Input
                            label="Question"
                            value={questionForm.questionText}
                            onChange={(e) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                questionText: e.target.value,
                              }))
                            }
                            placeholder="Enter your question..."
                            required
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Answer Options (click to mark correct)
                            </label>
                            <div className="space-y-2">
                              {questionForm.options.map((option, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setCorrectOption(index)}
                                    className={cn(
                                      "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                      option.isCorrect
                                        ? "border-green-500 bg-green-500"
                                        : "border-gray-300 hover:border-green-300",
                                    )}
                                  >
                                    {option.isCorrect && (
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    )}
                                  </button>
                                  <input
                                    type="text"
                                    value={option.optionText}
                                    onChange={(e) =>
                                      updateOptionText(index, e.target.value)
                                    }
                                    placeholder={`Option ${index + 1}${index < 2 ? " (required)" : " (optional)"}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={createQuestionMutation.isPending}
                          >
                            {createQuestionMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            <Save className="h-4 w-4 mr-2" />
                            Save Question
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddingQuestionToQuiz(null)}
                          >
                            Cancel
                          </Button>
                        </CardFooter>
                      </form>
                    </Card>
                  )}

                  {/* Questions List */}
                  {quizDetails.questions && quizDetails.questions.length > 0 ? (
                    <div className="space-y-3">
                      {quizDetails.questions.map((question, qIndex) => (
                        <div
                          key={question.id}
                          className="bg-white rounded-lg p-4 border"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {qIndex + 1}. {question.questionText}
                              </p>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {question.answerOptions?.map((option) => (
                                  <div
                                    key={option.id}
                                    className={cn(
                                      "text-sm px-3 py-1.5 rounded",
                                      option.isCorrect
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-600",
                                    )}
                                  >
                                    {option.isCorrect && (
                                      <CheckCircle className="h-3 w-3 inline mr-1" />
                                    )}
                                    {option.optionText}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this question?")) {
                                  deleteQuestionMutation.mutate(question.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No questions yet. Add your first question!
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">No Quizzes Yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first quiz to get started!
            </CardDescription>
            <Button onClick={() => setShowCreateQuiz(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
