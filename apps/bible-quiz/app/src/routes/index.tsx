import { createFileRoute, Link } from "@tanstack/react-router";
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
import { BookOpen, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated } = useAuth();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => api.quiz.list(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Test Your Biblical Knowledge
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Challenge yourself with our collection of Bible quizzes. Learn,
          explore, and deepen your understanding of Scripture.
        </p>
        {!isAuthenticated && (
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quiz List */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Available Quizzes
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    {quiz.title}
                  </CardTitle>
                  {quiz.description && (
                    <CardDescription>{quiz.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {quiz.createdByUser && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {quiz.createdByUser.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  {isAuthenticated ? (
                    <Link
                      to="/quiz/$quizId"
                      params={{ quizId: String(quiz.id) }}
                    >
                      <Button>Start Quiz</Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button variant="outline">Sign in to take quiz</Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No quizzes available yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
