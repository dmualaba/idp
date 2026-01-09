import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  Trophy,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/result/$attemptId")({
  component: ResultPage,
});

function ResultPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate({ to: "/login" });
  }

  const {
    data: result,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["result", attemptId],
    queryFn: () => api.attempt.result({ attemptId: parseInt(attemptId) }),
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Result not found or not available.</p>
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Excellent! You're a Bible scholar!";
    if (percentage >= 80) return "Great job! Keep up the good work!";
    if (percentage >= 70) return "Good effort! Room for improvement.";
    if (percentage >= 60) return "Not bad! Keep studying.";
    return "Keep practicing! You'll get better.";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Score Card */}
      <Card className="mb-8">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                result.percentage >= 60 ? "bg-green-100" : "bg-red-100",
              )}
            >
              <Trophy
                className={cn(
                  "h-10 w-10",
                  result.percentage >= 60 ? "text-green-600" : "text-red-600",
                )}
              />
            </div>
          </div>
          <CardTitle className="text-2xl">{result.quiz?.title}</CardTitle>
          <CardDescription>
            {getScoreMessage(result.percentage)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center gap-8 py-6">
            <div className="text-center">
              <p
                className={cn(
                  "text-5xl font-bold",
                  getScoreColor(result.percentage),
                )}
              >
                {result.percentage}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Score</p>
            </div>
            <div className="h-16 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-semibold text-gray-900">
                {result.score}/{result.totalQuestions}
              </p>
              <p className="text-sm text-gray-500 mt-1">Correct Answers</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center gap-4">
          <Link to="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          {result.quiz && (
            <Link
              to="/quiz/$quizId"
              params={{ quizId: String(result.quiz.id) }}
            >
              <Button>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Answers</h2>

        {result.answers.map((answer, index) => {
          const isCorrect = answer.selectedOption.wasCorrect;

          return (
            <Card
              key={answer.questionId}
              className={cn(
                "border-l-4",
                isCorrect ? "border-l-green-500" : "border-l-red-500",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <CardTitle className="text-base font-medium">
                    {answer.questionText}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pl-12">
                <div className="space-y-2">
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      isCorrect
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800",
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span>
                      Your answer: <strong>{answer.selectedOption.text}</strong>
                    </span>
                  </div>

                  {!isCorrect && answer.correctOption && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        Correct answer:{" "}
                        <strong>{answer.correctOption.optionText}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
