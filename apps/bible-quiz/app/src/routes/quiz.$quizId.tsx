import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/quiz/$quizId")({
  component: QuizPage,
});

interface Answer {
  questionId: number;
  selectedOptionId: number;
}

function QuizPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate({ to: "/login" });
  }

  // Fetch quiz data
  const {
    data: quiz,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => api.quiz.get({ quizId: parseInt(quizId) }),
    enabled: !!quizId,
  });

  // Start quiz mutation
  const startMutation = useMutation({
    mutationFn: () => api.attempt.start({ quizId: parseInt(quizId) }),
    onSuccess: (data: { attemptId: number }) => {
      setAttemptId(data.attemptId);
      setIsStarted(true);
    },
  });

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: (submitData: { attemptId: number; answers: Answer[] }) =>
      api.attempt.submit(submitData),
    onSuccess: (result: { attemptId: number }) => {
      navigate({
        to: "/result/$attemptId",
        params: { attemptId: String(result.attemptId) },
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Quiz not found or no longer available.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate({ to: "/" })}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const selectedOptionId = currentQuestion
    ? answers.get(currentQuestion.id)
    : undefined;
  const allAnswered = questions.every((q) => answers.has(q.id));

  function handleSelectOption(optionId: number) {
    if (!currentQuestion) return;
    setAnswers((prev) => new Map(prev).set(currentQuestion.id, optionId));
  }

  function handleNext() {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }

  function handleSubmit() {
    if (!attemptId || !allAnswered) return;

    const answersArray: Answer[] = Array.from(answers.entries()).map(
      ([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }),
    );

    submitMutation.mutate({ attemptId, answers: answersArray });
  }

  // Quiz start screen
  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-16 w-16 text-primary-600" />
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription className="text-base mt-2">
                {quiz.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                This quiz contains <strong>{totalQuestions} questions</strong>.
                Answer all questions and submit to see your results.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => startMutation.mutate()}
              isLoading={startMutation.isPending}
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz question screen
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>
            {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion?.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion?.answerOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all",
                  selectedOptionId === option.id
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      selectedOptionId === option.id
                        ? "border-primary-600 bg-primary-600"
                        : "border-gray-300",
                    )}
                  >
                    {selectedOptionId === option.id && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option.optionText}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              isLoading={submitMutation.isPending}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!selectedOptionId}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Question navigator */}
      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-3">Quick navigation:</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={cn(
                "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                currentQuestionIndex === index
                  ? "bg-primary-600 text-white"
                  : answers.has(q.id)
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
