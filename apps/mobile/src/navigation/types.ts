export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Applications: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type JobsStackParamList = {
  JobsList: undefined;
  JobDetails: { jobId: string };
};

export type ApplicationsStackParamList = {
  ApplicationsList: undefined;
  ApplicationDetails: { applicationId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
};
