import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { userService, type UserStats } from "@/services/userService";
import { useQuery } from "@tanstack/react-query";

const ProfilePage = () => {
  const { user, isLoading, logoutMutation, updateProfileMutation } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["userStats"],
    queryFn: () => userService.getStats(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
      });
    }
  }, [user]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  const handleSave = () => {
    const updates: { username?: string; email?: string } = {};

    if (formData.username !== user?.username) {
      updates.username = formData.username;
    }
    if (formData.email !== user?.email) {
      updates.email = formData.email;
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate(updates, {
      onSuccess: () => {
        setIsEditing(false);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || "Failed to update profile");
      },
    });
  };

  if (isLoading || !user) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background px-4 py-20">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:py-20">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Header Card */}
        <Card className="w-full">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-2 ring-primary"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary">
                    <UserCircleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <CameraIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <CardTitle className="text-2xl sm:text-3xl">
                  {user.username}
                </CardTitle>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="text-xs">
                    {user.role === "admin" ? (
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    ) : null}
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Account Information Card */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Account Information</CardTitle>
                <CardDescription>
                  View and manage your account details
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <UserCircleIcon className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={!isEditing}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                User ID
              </Label>
              <Input
                type="text"
                value={user.id}
                disabled
                className="text-base font-mono text-muted-foreground"
              />
            </div>

            {isEditing && (
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Detection Activity</CardTitle>
            <CardDescription>
              Your contribution to the pothole map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 text-center p-4 rounded-lg bg-primary/10">
                <div className="flex items-center justify-center">
                  <MapPinIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {stats?.potholesDetected ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Potholes Detected
                </div>
              </div>

              <div className="space-y-2 text-center p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center">
                  <CameraIcon className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-secondary-foreground">
                  {stats?.detectionSessions ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Detection Sessions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Actions Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Notification Preferences
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Privacy Settings
            </Button>
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ProfilePage;
