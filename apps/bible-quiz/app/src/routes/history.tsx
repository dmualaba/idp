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
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  History,
  Trophy,
  Clock,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate({ to: "/login" });
  }

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["myAttempts"],
    queryFn: () => api.attempt.myAttempts(),
    enabled: isAuthenticated,
  });

  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return "text-gray-400";
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number | null) => {
    if (percentage === null) return "bg-gray-100";
    if (percentage >= 80) return "bg-green-100";
    if (percentage >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <History className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz History</h1>
          <p className="text-gray-500">
            View your past quiz attempts and scores
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : attempts && attempts.length > 0 ? (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card
              key={attempt.attemptId}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center",
                        getScoreBgColor(attempt.percentage),
                      )}
                    >
                      <Trophy
                        className={cn(
                          "h-6 w-6",
                          getScoreColor(attempt.percentage),
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {attempt.quiz?.title || "Unknown Quiz"}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {attempt.completedAt
                            ? new Date(attempt.completedAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "In Progress"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {attempt.completedAt ? (
                      <>
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-2xl font-bold",
                              getScoreColor(attempt.percentage),
                            )}
                          >
                            {attempt.percentage}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {attempt.score}/{attempt.totalQuestions} correct
                          </p>
                        </div>
                        <Link
                          to="/result/$attemptId"
                          params={{ attemptId: String(attempt.attemptId) }}
                        >
                          <Button variant="outline" size="sm">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">No Quiz History Yet</CardTitle>
            <CardDescription className="mb-6">
              You haven't taken any quizzes yet. Start your first quiz now!
            </CardDescription>
            <Link to="/">
              <Button>Browse Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
