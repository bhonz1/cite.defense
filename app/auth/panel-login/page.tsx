"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function PanelLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting panel login for username:', username);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (!res.ok) {
        console.error('Login failed:', data.error);
        toast.error(data.error || "Invalid username or password");
      } else {
        // Check if user is PANEL
        console.log('User role from response:', data.user?.role);
        if (data.user?.role !== "PANEL") {
          console.error('Invalid role for panel login:', data.user?.role);
          toast.error("This login is for PANEL users only");
          setIsLoading(false);
          return;
        }

        toast.success("Login successful!");

        // Redirect to panel
        const targetPath = "/panel";

        // Use router.push with await for proper navigation
        await router.push(targetPath);

        // Force refresh to ensure auth state is updated
        router.refresh();

        // Fallback: use window.location if router doesn't work
        setTimeout(() => {
          if (window.location.pathname === "/auth/panel-login") {
            window.location.href = targetPath;
          }
        }, 500);
      }
    } catch (error) {
      console.error('Panel login error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <GraduationCap className="h-10 w-10 text-orange-500" />
            <span className="font-bold text-2xl text-gray-900">DefenseScheduler</span>
          </Link>
        </div>
        
        <Card className="border-gray-200">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-orange-500" />
              <CardTitle className="text-2xl text-center">Panel Login</CardTitle>
            </div>
            <CardDescription className="text-center">
              Sign in to access your panel dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-300"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          <Link href="/auth/login" className="text-orange-500 hover:underline">
            Back to main login
          </Link>
        </p>
      </div>
    </div>
  );
}
