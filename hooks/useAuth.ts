"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSessionStore, toAuthSession } from "@/lib/stores/auth-session";
import { getMe, logout, login, signup, forgotPassword, resetPassword, resendVerification, verifyEmail, acceptInvitation } from "@/lib/backend";

export function useAuth() {
  const queryClient = useQueryClient();
  const session = useAuthSessionStore((state) => state.session);
  const clearSession = useAuthSessionStore((state) => state.clearSession);
  const setSession = useAuthSessionStore((state) => state.setSession);

  const meQuery = useQuery({
    queryKey: ["auth", "me", session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) return null;
      const res = await getMe(session.accessToken);
      return res.data.user;
    },
    enabled: !!session?.accessToken,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (session?.accessToken) {
        await logout(session.accessToken);
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setSession(toAuthSession(res.data));
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: signup,
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => resetPassword(token, password),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => resendVerification(email),
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: ({ token, name, password }: { token: string; name: string; password: string }) =>
      acceptInvitation(token, name, password),
  });

  const activeWorkspace = session?.user?.memberships?.[0] ?? null;

  return {
    user: meQuery.data ?? session?.user ?? null,
    session,
    isAuthenticated: !!session?.accessToken,
    isLoading: meQuery.isLoading,
    activeWorkspace,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,
    acceptInvitation: acceptInvitationMutation.mutateAsync,
  };
}
