export interface SignupDto {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface InvitationAcceptDto {
  token: string;
  name: string;
  password: string;
}
